import imaplib
import email
from email.header import decode_header
import os
import json
from datetime import datetime

# Load env in case this is run independently
from dotenv import load_dotenv
load_dotenv()

def fetch_unread_emails():
    username = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")
    
    # Connecting to Gmail IMAP
    imap_server = "imap.gmail.com"
    mail = imaplib.IMAP4_SSL(imap_server)
    
    try:
        mail.login(username, password)
        mail.select("inbox")
        
        # Use ALL so we don't miss an email if it was accidentally opened/read in Gmail
        status, response = mail.search(None, 'ALL')
        email_ids = response[0].split()
        
        # Get the latest 10 emails (Fetching less for significantly faster SYNC response)
        latest_email_ids = email_ids[-10:] if len(email_ids) > 10 else email_ids
        
        parsed_emails = []
        if latest_email_ids:
            # Fetch all 30 emails in one single IMAP request for speed
            fetch_ids = b','.join(latest_email_ids)
            status, msg_data = mail.fetch(fetch_ids, '(RFC822)')
            
            # msg_data contains tuples of header/body + some closing tags
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    # extract the original ID if possible, but we'll assign one dynamically if needed
                    e_id = response_part[0].split()[0]
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Decode email subject
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding if encoding else "utf-8")
                        
                    # Get Sender
                    sender = msg.get("From")
                    
                    # Get Date
                    date_ = msg.get("Date")
                    
                    # Extract body
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition"))
                            
                            try:
                                body = part.get_payload(decode=True).decode()
                                if content_type == "text/plain":
                                    break
                            except:
                                pass
                    else:
                        body = msg.get_payload(decode=True).decode()
                        
                    parsed_email = {
                        "id": str(e_id.decode()),
                        "subject": subject,
                        "sender": sender,
                        "date": date_,
                        "body": body[:500] # truncate
                    }
                    
                    # Filter out non-order system emails (like spam from GeeksforGeeks, promotions, etc.)
                    subject_body = (subject + ' ' + body).lower()
                    
                    is_valid_sender = any(domain in sender.lower() for domain in ['lps admin', '98165mkm@gmail.com', 'ritindia', 'ritinida', '.edu'])
                    is_explicitly_car_order = any(kw in subject_body for kw in ['car model', 'kuv', 'xuv', 'thar', 'mpv', 'units'])
                    is_spam_sender = any(spam in sender.lower() for spam in ['geeks', 'robin', 'day1x', 'promo', 'news', 'noreply', 'no-reply', 'substack', 'linkedin', 'github'])
                    
                    if not is_spam_sender and (is_valid_sender or is_explicitly_car_order):
                        parsed_emails.append(parsed_email)
            
            # Reverse to show latest first
            parsed_emails.reverse()
                    
        return {
            "success": True, 
            "data": parsed_emails
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try:
            mail.logout()
        except:
            pass

def delete_email(email_id):
    username = os.getenv("SMTP_EMAIL")
    password = os.getenv("SMTP_PASSWORD")
    
    imap_server = "imap.gmail.com"
    mail = imaplib.IMAP4_SSL(imap_server)
    
    try:
        mail.login(username, password)
        mail.select("inbox")
        
        # Move to Trash (Gmail specific [Gmail]/Trash)
        # Note: Different languages might have different Trash folder names
        # Most accounts use '[Gmail]/Trash'
        status, response = mail.copy(email_id, '[Gmail]/Trash')
        if status == 'OK':
            # Delete from inbox after copy
            mail.store(email_id, '+FLAGS', '\\Deleted')
            mail.expunge()
            return {"success": True, "message": "Email moved to Trash"}
        else:
            return {"success": False, "error": f"Failed to copy email: {response}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try:
            mail.logout()
        except:
            pass

if __name__ == "__main__":
    # Test fetch
    # print(json.dumps(fetch_unread_emails(), indent=2))
    pass
