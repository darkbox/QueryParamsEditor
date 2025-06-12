/**
 * QueryParamsEditor
 * 
 * A custom element for editing query parameters in the URL.
 * 
 * @param {string} key-text - The label for the key input field.
 * @param {string} value-text - The label for the value input field.
 * @param {string} initial-data - The initial data for the editor.
 * @param {string} add-button-text - The label for the add button.
 * 
 * @returns {Object} QueryParamsEditor
 */
class QueryParamsEditor extends HTMLElement {

    static get observedAttributes() {
        return ['key-text', 'value-text', 'initial-data', 'add-button-text', 'target'];
    }

    /**
     * Given a complete URL (e.g. "https://x?foo=bar&baz=qux")
     * or only the query ("foo=bar&baz=qux" or "?foo=bar…"),
     * returns the JSON that can be copied in initial-data or an array
     * to be used in setParams.
     * 
     * @param {string} input - The URL to parse.
     * @param {boolean} asArray - Whether to return the data as an array.
     * @returns {string|Array} The JSON string or array.
     */
    static parseUrlToData(input, asArray = false) {
        // extrae la parte ?… o la añade si falta
        let search;
        if (input.includes('?')) {
            search = input.slice(input.indexOf('?'));
        } else if (input.includes('=')) {
            search = '?' + input;
        } else {
            // ningún parámetro
            return '[]';
        }
        const usp = new URLSearchParams(search);
        const arr = [];
        for (const [key, value] of usp.entries()) {
            arr.push({ key, value });
        }
        return asArray ? arr : JSON.stringify(arr);
    }

    constructor() {
        super();
    }

    connectedCallback() {
        if (!this.style.display) this.style.display = 'block';

        this._render();
        this._bindEvents();
        this.loadParams();
        this.updateQuery();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!this._initialized) return;
        switch (name) {
            case 'key-text':
                this.thead.querySelectorAll('th')[0].textContent = newVal;
                this._updatePlaceholders(0, newVal);
                break;
            case 'value-text':
                this.thead.querySelectorAll('th')[1].textContent = newVal;
                this._updatePlaceholders(1, newVal);
                break;
            case 'add-button-text':
                this.btnAdd.textContent = newVal;
                break;
            case 'target':
                this.updateQuery();
                break;
        }
    }

    _render() {
        const kLabel = this.getAttribute('key-text') || 'Key';
        const vLabel = this.getAttribute('value-text') || 'Value';
        const addTxt = this.getAttribute('add-button-text') || 'Add parameter';

        this.innerHTML = `
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead><tr>
                <th>${kLabel}</th>
                <th>${vLabel}</th>
                <th style="width:1%"></th>
              </tr></thead>
              <tbody></tbody>
            </table>
            <button class="btn btn-sm btn-secondary">${addTxt}</button>
          </div>
        `;
        this.thead = this.querySelector('thead');
        this.tbody = this.querySelector('tbody');
        this.btnAdd = this.querySelector('button');
        this._initialized = true;
    }

    _bindEvents() {
        this.btnAdd.addEventListener('click', () => this.addRow());
    }

    _updatePlaceholders(colIdx, text) {
        this.tbody.querySelectorAll('tr').forEach(tr => {
            tr.cells[colIdx].querySelector('input').placeholder = text;
        });
    }

    _getSearchParams() {
        const usp = new URLSearchParams();
        this.tbody.querySelectorAll('tr').forEach(tr => {
            const [k, v] = [...tr.querySelectorAll('input')].map(i => i.value.trim());
            if (k) usp.set(k, v);
        });
        return usp;
    }

    loadParams() {
        const raw = this.getAttribute('initial-data');
        let items = [];
        if (raw) {
            try { items = JSON.parse(raw); } catch { }
        }
        if (items.length) items.forEach(i => this.addRow(i.key, i.value));
        else this.addRow();
    }

    addRow(key = '', val = '') {
        const kph = this.getAttribute('key-text') || 'Key';
        const vph = this.getAttribute('value-text') || 'Value';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input class="form-control form-control-sm" placeholder="${kph}" value="${key}"></td>
          <td><input class="form-control form-control-sm" placeholder="${vph}" value="${val}"></td>
          <td><button class="btn btn-sm btn-danger">&times;</button></td>
        `;
        tr.querySelectorAll('input')
            .forEach(i => i.addEventListener('input', () => this.updateQuery()));
        tr.querySelector('button')
            .addEventListener('click', () => { tr.remove(); this.updateQuery(); });
        this.tbody.appendChild(tr);
    }

    updateQuery() {
        const usp = this._getSearchParams();
        const qs = usp.toString();

        const selector = this.getAttribute('target');
        if (selector) {
            document.querySelectorAll(selector).forEach(el => {
                if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                    el.value = qs;
                } else {
                    el.textContent = qs;
                }
            });
        }
    }

    /**
     * Get the parameters from the editor.
     * 
     * @returns {Object} The parameters.
     */
    getParams() {
        return Object.fromEntries(this._getSearchParams());
    }

    /**
     * Set the parameters in the editor.
     * 
     * @param {Array} data 
     * @param {boolean} append 
     */
    setParams(data = [], append = false) {
        if (!Array.isArray(data)) {
            throw new Error('data must be an array');
        }

        if (append) {
            data.forEach(({ key, value }) => this.addRow(key, value));
        } else {
            this.tbody.innerHTML = '';
            data.forEach(({ key, value }) => this.addRow(key, value));
            if (data.length === 0) this.addRow();
        }
        this.updateQuery();
    }
}

customElements.define('query-params-editor', QueryParamsEditor);
