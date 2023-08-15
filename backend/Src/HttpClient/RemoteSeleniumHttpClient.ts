import { Builder, By, WebDriver } from 'selenium-webdriver';

import { HttpClient } from './HttpClient';

export class RemoteSeleniumHttpClient implements HttpClient {
  private browser!: WebDriver;

  static async Create(url: string, browser: string): Promise<RemoteSeleniumHttpClient> {
    const instance = new RemoteSeleniumHttpClient();

    instance.browser = await new Builder()
      .forBrowser(browser)
      .usingServer(url)
      .build();

    return instance;
  }

  private constructor() { }

  async Get(url: string): Promise<string> {
    await this.browser.get(url);

    return this.browser.findElement(By.css('body')).getText();
  }

  async Dispose(): Promise<void> {
    await this.browser.quit();
  }
}
