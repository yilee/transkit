const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const regionInput = document.getElementById('region') as HTMLInputElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const enabledToggle = document.getElementById('enabled') as HTMLInputElement;
const toggleHint = document.getElementById('toggleHint') as HTMLElement;

function updateHint(checked: boolean): void {
  toggleHint.textContent = checked ? 'Enabled' : 'Disabled';
}

// Load existing values
chrome.storage.sync.get(['apiKey', 'region', 'enabled'], (cfg) => {
  if (cfg.apiKey) apiKeyInput.value = cfg.apiKey as string;
  if (cfg.region) regionInput.value = cfg.region as string;
  const isEnabled = cfg.enabled !== false; // default true
  enabledToggle.checked = isEnabled;
  updateHint(isEnabled);
});

enabledToggle.addEventListener('change', () => {
  const checked = enabledToggle.checked;
  chrome.storage.sync.set({ enabled: checked });
  updateHint(checked);
});

saveBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  const region = regionInput.value.trim();

  if (!apiKey || !region) {
    statusEl.textContent = 'Both fields are required.';
    statusEl.className = 'error';
    return;
  }

  await chrome.storage.sync.set({ apiKey, region });
  statusEl.textContent = 'Saved!';
  statusEl.className = '';
  setTimeout(() => { statusEl.textContent = ''; }, 2000);
});
