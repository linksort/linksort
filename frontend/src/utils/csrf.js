export default class CSRFStore {
  csrf = document.querySelector("meta[name='csrf']").getAttribute("content");

  get() {
    return this.csrf;
  }

  set(csrf) {
    this.csrf = csrf;
  }

  scanResponse(response) {
    const newCSRF = response.headers.get("X-Csrf-Token");
    if (newCSRF) {
      this.set(newCSRF);
    }
  }
}
