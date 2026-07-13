# Roadmap

The active public milestone is
[0.2 hardening and public-source cutover](https://github.com/global-torque/vitepress-toolkit/milestone/1).

Promotion order:

1. Merge reviewed source and governance on protected `main`.
2. Create one clean, attested beta candidate and retain its exact bytes.
3. Pass npm/pnpm clean rooms and the named real-consumer gate.
4. Publish the exact reviewed npm prerelease under the `next` tag and validate
   the registry bytes.
5. Configure npm trusted publishing and provenance before automated or stable
   releases.

The initial prerelease uses an owner-authorized authenticated npm publication
from the retained artifact. Deletion of private fallback source remains blocked
until the named-consumer and public-evidence gates pass.
