# Implementation Plan: Enhancing the Supervisor Dashboard & XUV Data Integration

This plan outlines the steps to make the Supervisor Dashboard functional and integrate the new XUV production data.

## 1. Supervisor Dashboard: Data Integration & Persistence
Currently, the Supervisor Dashboard uses static mock data. We will move this to the `localDB` for persistence.

- [ ] **Schema Update**: Add `verifications` to `localDB` schema.
- [ ] **Refactor API**: Update `src/features/supervisor/api.ts` to use `localDB`.
- [ ] **Persistent Actions**: Ensure the "Verify" button updates the status in the database permanently.

## 2. Supervisor Dashboard: Feature Enhancements
- [ ] **Issue Reporting**: Add a "Flag Issue" action to the verification list.
- [ ] **Shift Handover**: Implement a "Finalize Shift Report" modal that summarizes the shift's KPIs.
- [ ] **Operator Timeline**: Add a small timeline showing operator activity for the current shift.

## 3. Visual & UX Polish
- [ ] **Verification Feedback**: Add a "Success" animation when a VIN is successfully verified.
- [ ] **Empty State**: Design a clean "All Caught Up" state.
- [ ] **KPI Trend Indicators**: Add trend arrows (up/down) next to KPI values.

## 4. XUV Data Integration
The user has provided `xuv.xlsx` and `xuv1.xlsx`. These contain Bill of Materials (BOM) data for XUV models.
- [ ] **Data Conversion**: Parse `xuv.xlsx` and `xuv1.xlsx` into JSON format (e.g., `xuvData.json`).
- [ ] **Model Mapping**: Link the parsed data to the "XUV 700" model in the system.
- [ ] **Dynamic Loading**: Update `ProductionPlanningPage.tsx` to load data for XUV models from the new JSON files.

## 5. Technical Tasks
- [ ] Add `Verification` type to the shared `types` directory.
- [ ] Install `xlsx` or similar library if needed for parsing, or perform a manual conversion if requested.
