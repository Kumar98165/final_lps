import imaplib
import email
from email.header import decode_header
import email.utils
import os
import json
import socket
from datetime import datetime
from app.extensions import db
from app.models.models import EmailRequest, Status

# Load env in case this is run independently
from dotenv import load_dotenv
load_dotenv()

def fetch_unread_emails():
    username = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")
    
    print(f"[SYNC] Starting IMAP sync for {username}")
    
    if not username or not password:
        print("[SYNC] ERROR: Missing SMTP credentials in environment")
        return {"success": False, "error": "Missing credentials"}
    
    # Connecting to Gmail IMAP with socket timeout (compatible with all Python versions)
    imap_server = "imap.gmail.com"
    old_timeout = socket.getdefaulttimeout()
    socket.setdefaulttimeout(20)
    mail = None
    try:
        print(f"[SYNC] Connecting to {imap_server}...")
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(username, password)
        print("[SYNC] Login successful. Selecting inbox...")
        mail.select("inbox")
        
        # Use UID to get permanent identifiers for each email
        # Search for ALL mails to ensure we don't miss anything
        status, response = mail.uid('search', None, 'ALL')
        if status != 'OK':
            print("[SYNC] ERROR: Search failed")
            return {"success": False, "error": "Search failed"}
            
        uids = response[0].split()
        print(f"[SYNC] Found {len(uids)} total emails in inbox")
        
        # Process the latest 100 UIDs, reverse to start with newest
        latest_uids = list(uids[-100:]) if len(uids) > 100 else list(uids)
        latest_uids.reverse()
        
        new_count = 0
        if latest_uids:
            for uid_bytes in latest_uids:
                uid = uid_bytes.decode()
                
                # Check if we already have this UID in our database
                existing = EmailRequest.query.filter_by(imap_uid=uid).first()
                if existing:
                    continue
                
                status, msg_data = mail.uid('fetch', uid, '(RFC822)')
                if status != 'OK' or not msg_data:
                    continue
                    
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        # Extract Metadata
                        message_id = msg.get("Message-ID")
                        subject, encoding = decode_header(msg.get("Subject", ""))[0]
                        if isinstance(subject, bytes):
                            subject = subject.decode(encoding if encoding else "utf-8")
                            
                        sender_full = msg.get("From", "")
                        sender_parsed = email.utils.parseaddr(sender_full)
                        sender_name = sender_parsed[0]
                        sender_email = sender_parsed[1]
                        
                        date_str = msg.get("Date")
                        received_at = datetime.now()
                        if date_str:
                            try:
                                received_at = datetime.fromtimestamp(email.utils.mktime_tz(email.utils.parsedate_tz(date_str)))
                            except:
                                pass
                        
                        # Extract body
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    try:
                                        body = part.get_payload(decode=True).decode()
                                        break
                                    except: pass
                        else:
                            try:
                                body = msg.get_payload(decode=True).decode()
                            except: pass

                        # Filter: Detect Production Order emails
                        subject_body = (subject + ' ' + body).lower()
                        
                        # Broad order/demand keywords
                        order_keywords = [
                            'car model', 'production order', 'order request', 'new model order',
                            'requirement', 'demand', 'quantity', 'units', 'manufacturing',
                            'vehicle', 'order', 'request', 'mahindra', 'tata', 'toyota'
                        ]
                        # Specific model names we track
                        model_keywords = [
                            'kuv', 'xuv', 'thar', 'mpv', 'tml', 'winger', 'curvv',
                            'marazzo', 'scorpio', 'bolero', 'arjun', 'ev model', 'electric'
                        ]
                        
                        has_order_keyword = any(kw in subject_body for kw in order_keywords)
                        has_model_mention = any(m in subject_body for m in model_keywords)
                        
                        is_relevant = has_order_keyword or has_model_mention
                        
                        # Spam detection: ONLY check the sender address, not body content
                        # (body keywords like 'update', 'notification' often appear in real orders too)
                        spam_sender_patterns = [
                            'noreply', 'no-reply', 'mailer-daemon', 'newsletter@', 
                            'substack', 'linkedin.com', 'github.com', 'geeks', 
                            'donotreply', 'automated@', 'bounce@'
                        ]
                        is_spam = any(spam in sender_full.lower() for spam in spam_sender_patterns)
                        
                        # Only save if it looks like a real customer order and NOT spam
                        print(f"[SYNC]   UID {uid}: relevant={is_relevant}, spam={is_spam}, subject='{subject[:60]}'")
                        if is_relevant and not is_spam:
                            # Truncate fields to prevent VARCHAR(255) overflow
                            safe_subject = (subject or '').strip()[:250]
                            safe_message_id = (message_id or '')[:250]
                            new_request = EmailRequest(
                                imap_uid=uid,
                                message_id=safe_message_id,
                                sender=(sender_name or "External Customer")[:250],
                                sender_email=(sender_email or '')[:250],
                                subject=safe_subject,
                                body=body[:3000],
                                received_at=received_at,
                                status=Status.UNREAD
                            )
                            db.session.add(new_request)
                            new_count += 1
                            print(f"[SYNC]   ✓ SAVED new email: {safe_subject[:60]}")
            
            db.session.commit()
            print(f"[SYNC] Done. {new_count} new email(s) saved.")
                    
        # Return all tracked emails from database ordered by date
        all_tracked = EmailRequest.query.order_by(EmailRequest.received_at.desc()).all()
        return {
            "success": True, 
            "data": [e.to_dict() for e in all_tracked]
        }
    except Exception as e:
        print(f"[SYNC] EXCEPTION: {type(e).__name__}: {e}")
        # Even if IMAP fails, return what we have in DB so the UI doesn't break
        try:
            all_tracked = EmailRequest.query.order_by(EmailRequest.received_at.desc()).all()
            return {"success": True, "data": [em.to_dict() for em in all_tracked], "warning": str(e)}
        except:
            return {"success": False, "error": str(e)}
    finally:
        socket.setdefaulttimeout(old_timeout)
        try:
            if mail:
                mail.logout()
        except:
            pass

def delete_email(email_id):
    """Note: email_id here represents the internal database ID or imap_uid"""
    username = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")
    
    imap_server = "imap.gmail.com"
    mail = imaplib.IMAP4_SSL(imap_server)
    
    try:
        mail.login(username, password)
        mail.select("inbox")
        
        # Locate the request in our DB to get its UID
        req = EmailRequest.query.get(email_id)
        if not req:
            return {"success": False, "error": "Order request not found in database"}
            
        uid = req.imap_uid
        
        # Move to Trash (Gmail specific)
        status, response = mail.uid('copy', uid, '[Gmail]/Trash')
        if status == 'OK':
            mail.uid('store', uid, '+FLAGS', '\\Deleted')
            mail.expunge()
            
            # Remove from our database too so it's truly deleted
            db.session.delete(req)
            db.session.commit()
            return {"success": True, "message": "Email moved to Trash and removed from database"}
        else:
            return {"success": False, "error": f"Failed to delete from Gmail: {response}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try:
            mail.logout()
        except:
            pass

