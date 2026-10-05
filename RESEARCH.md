# Research fixture — not a finding

This repository is owned by the npm package maintainer and contains only the
approved synthetic package version 0.0.2 plus one manually triggered workflow.
No workflow runs on push. The npm trusted publisher will be configured to
allow **stage publishing only**, with direct publish disabled. A single manual
workflow run will call `npm publish --tag stage-probe`; npm documentation says
that should be rejected. If it unexpectedly succeeds, version 0.0.2 becomes
public under a non-default tag while `latest` remains on 0.0.1.

No npm access token or GitHub secret is stored in this repository. The OIDC
identity comes from the GitHub-hosted runner with `id-token: write`.
