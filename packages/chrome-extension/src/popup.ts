const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const regionInput = document.getElementById('region') as HTMLInputElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

// Load existing values
chrome.storage.sync.get(['apiKey', 'region'], (cfg) => {
  if (cfg.apiKey) apiKeyInput.value = cfg.apiKey as string;
  if (cfg.region) regionInput.value = cfg.region as string;
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
