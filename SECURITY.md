# Security policy

## Supported versions

Security fixes currently target the latest release on `main`.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature for this repository. Do not include sensitive exploit details in a public issue.

A useful report includes the affected route or component, reproduction steps, expected impact, and any suggested mitigation. Never test against data or accounts you do not own.

## Current security posture

StockOrNot 0.1.0 is an MVP. Anonymous cookie identity, daily uniqueness, bound SQL parameters, and server-side input validation reduce common abuse but are not a complete anti-fraud system. Before broad public voting, the service should add edge rate limiting, monitoring, anomaly detection, and a formal incident-response process.

