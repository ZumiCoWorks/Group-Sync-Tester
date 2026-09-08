# AFDA Continuum — CARS Handoff

## Current status

CARS is not connected. No official AFDA import template, field specification or integration credential has been supplied. The Registry page exports only clearly fictional DEMO CSV data and must not be presented as CARS-compatible.

## Proposed controlled handoff

1. Registry resolves missing student, assessment and academic-period mappings.
2. An authorised finaliser confirms the result state and formula version.
3. Registry certifies the batch.
4. A user with `export_authority` generates a versioned file.
5. A second authorised reviewer confirms row count, totals and exceptions.
6. Registry imports the file into CARS using the institution-approved procedure.
7. Continuum records the export checksum, operator, time and manual import confirmation.

Changing a result after export marks the previous batch outdated; it never mutates the historical export silently.

## Required institutional contract

- Official column names, types, code lists and delimiter/encoding rules.
- Rules for amendments, resubmissions and withdrawn students.
- Required assessment, qualification, campus and period mappings.
- Maximum batch size and validation feedback format.
- Named export and import authorities.
- Retention and reconciliation requirements.

Until these are approved, CARS remains “Not connected” and every generated file remains a POC artifact.
