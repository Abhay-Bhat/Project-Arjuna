// ============================================================
// Skadi — Event Bindings
// ============================================================

const Events = {
  init() {
    // Today tab
    document.getElementById('todayBtn')?.addEventListener('click', () => {
      AppState.selectedDate = new Date();
      AppState.save();
      UI.updateAll();
      UI.showToast('📅 Back to today');
    });

    document.getElementById('resetBtn')?.addEventListener('click', () => {
      if (confirm('Reset all activity checks for the selected date?')) {
        Scheduler.resetToday();
        UI.updateAll();
        UI.showToast('🔄 Activities reset');
      }
    });

    // QC card toggles handled by UI._bindQCCards() — no stale bindings needed here

    // Mission Phases Modal
    document.getElementById('headerDateToggle')?.addEventListener('click', () => {
      document.getElementById('phasesModal').style.display = 'flex';
      // Render the timeline every time (keeps it in sync with current date)
      if (typeof UI !== 'undefined' && UI._renderPhaseTimeline) {
        UI._renderPhaseTimeline();
      }
    });

    document.getElementById('phasesClose')?.addEventListener('click', () => {
      document.getElementById('phasesModal').style.display = 'none';
    });

    document.getElementById('phasesModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'phasesModal') {
        document.getElementById('phasesModal').style.display = 'none';
      }
    });

    // Investment Form (enhanced)
    document.getElementById('investmentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('invType')?.value;
      const amount = document.getElementById('invAmount')?.value;
      if (!type || !amount) return;

      FinanceTracker.addInvestment({
        type,
        amount,
        notes:            document.getElementById('invNotes')?.value || '',
        date:             document.getElementById('invDate')?.value || '',
        bankAccount:      document.getElementById('invBankAccount')?.value || '',
        maturityDate:     document.getElementById('invMaturityDate')?.value || '',
        tenure:           parseFloat(document.getElementById('invTenure')?.value) || 0,
        tenureUnit:       document.getElementById('invTenureUnit')?.value || 'Years',
        status:           document.getElementById('invStatus')?.value || 'active',
        depositType:      document.getElementById('invDepositType')?.value || 'FD',
        insuranceType:    type === 'Insurance' ? (document.getElementById('invInsuranceType')?.value || '') : '',
        sipMode:          document.getElementById('invSIPMode')?.value || 'SIP',
        coverAmount:      document.getElementById('invCoverAmount')?.value || 0,
        premiumFrequency: document.getElementById('invPremiumFrequency')?.value || '',
        interestRate:     document.getElementById('invInterestRate')?.value || 0,
        openingBalance:   document.getElementById('invOpeningBalance')?.value || 0,
        ticker:           document.getElementById('invTicker')?.value || '',
        tickerExchange:   document.getElementById('invExchange')?.value || 'NSE',
        units:            document.getElementById('invUnits')?.value || 0,
        amfiCode:         document.getElementById('invAmfiCode')?.value || '',
        livePrice:        document.getElementById('invLivePrice')?.value || 0,
      });

      // Reset form
      ['invType','invAmount','invNotes','invDate','invBankAccount','invMaturityDate',
       'invTenure','invTenureUnit','invInsuranceType','invCoverAmount','invInterestRate',
       'invOpeningBalance','invExchange','invTicker','invUnits','invAmfiCode','invLivePrice',
       'invSIPMode','invDepositType'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; delete el.dataset.userEdited; }
      });
      const statusEl = document.getElementById('invStatus');
      if (statusEl) statusEl.value = 'active';
      const preview = document.getElementById('invCalcPreview');
      if (preview) preview.style.display = 'none';
    });

    // Currency Converter
    const setupCurrencyConverter = () => {
      const amountInput = document.getElementById('converterAmount');
      const fromSelect = document.getElementById('currencyFrom');
      const toSelect = document.getElementById('currencyTo');

      const performConversion = async () => {
        const amount = parseFloat(amountInput?.value);
        const from = fromSelect?.value;
        const to = toSelect?.value;

        if (!amount || amount <= 0 || !from || !to) {
          document.getElementById('convertedAmount').textContent = '—';
          document.getElementById('exchangeRate').textContent = 'Exchange rate: —';
          return;
        }

        try {
          const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
          const data = await response.json();
          const rate = data.rates[to];

          if (rate) {
            const converted = (amount * rate).toFixed(2);
            document.getElementById('convertedAmount').textContent =
              `${amount.toLocaleString('en-IN')} ${from} = ${converted.toLocaleString('en-IN')} ${to}`;
            document.getElementById('exchangeRate').textContent =
              `Exchange rate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
          }
        } catch (error) {
          console.error('Currency conversion error:', error);
          document.getElementById('convertedAmount').textContent = 'Error fetching rates';
        }
      };

      amountInput?.addEventListener('input', performConversion);
      fromSelect?.addEventListener('change', performConversion);
      toSelect?.addEventListener('change', performConversion);
    };

    setupCurrencyConverter();
  }
};
