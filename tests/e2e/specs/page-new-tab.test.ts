import { canSwitchTheme } from '../helpers/theme';

describe('Webextension New Tab', () => {
  it.skip('should open the extension page when a new tab is opened', async () => {
    // Use .skip to disable the test
    const extensionPath = await browser.getExtensionPath();
    const newTabUrl = process.env.__FIREFOX__ === 'true' ? `${extensionPath}/new-tab/index.html` : 'chrome://newtab';

    await browser.url(newTabUrl);

    const appDiv = await $('.App').getElement();
    await expect(appDiv).toBeExisting();
    await canSwitchTheme();
  });
});
