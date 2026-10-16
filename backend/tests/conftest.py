import os
import tempfile

# Tests run offline-safe: allow the synthetic data fallback and keep persisted state out of the repo.
os.environ.setdefault("ALLOW_SYNTHETIC_DATA", "1")

import backend.api.storage as _storage  # noqa: E402

_tmp = tempfile.mkdtemp(prefix="qs-test-data-")
for _name in ("STRATEGIES_FILE", "BACKTESTS_FILE", "SETTINGS_FILE"):
    setattr(_storage, _name, os.path.join(_tmp, os.path.basename(getattr(_storage, _name))))
