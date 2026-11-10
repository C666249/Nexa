# Nexa Project State

Current release: 1.0.36 / versionCode 42.

Cloud coexistence line:
- applicationId: com.nexa.app.cloud
- app label: Nexa
- default launcher icon: Star
- alternate launcher icons: Classic N / Warm checklist
- launcher icon is switchable in Space > Tools & Settings > App icon.
- Full backup/restore remains the migration path from the old Android Studio-signed Nexa to this cloud package.

Signing policy:
- This package must keep one fixed signing key for all future cloud releases.
- Public GitHub source must never contain the private keystore or passwords.
- GitHub Actions signing must use repository Secrets.
