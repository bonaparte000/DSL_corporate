import os
from pathlib import Path

OPENAI_API_KEY  = os.getenv('OPENAI_API_KEY', '')
EXTRACT_MODEL   = 'gpt-4o-mini'
MIN_BRAND_COUNT = 3
CALL_DELAY      = 1.5   # seconds between API calls

CACHE_DIR   = Path('cache')
RESULTS_DIR = Path('results')
PLOTS_DIR   = RESULTS_DIR / 'plots'
