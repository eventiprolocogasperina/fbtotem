document.addEventListener('DOMContentLoaded', () => {
    const products = [
        { id: 'Birra', name: 'Birra Apostel', price: 3.00, img: 'imgs/Apostel_Logo.png' },
        { id: 'Gladium', name: 'Birra Gladium', price: 4.00, img: 'imgs/gladium.png' },
        { id: 'Cocacola', name: 'Cocacola', price: 2.00, img: 'imgs/Coca-Cola.png' },
        { id: 'Cocacola Zero', name: 'Cocacola Zero', price: 2.00, img: 'imgs/cc_zero.png' },
        { id: 'Acqua', name: 'Acqua', price: 1.00, img: 'imgs/wat.png' },
        { id: 'Graffa', name: 'Graffa', price: 3.00, img: 'imgs/graffa.png' },
        { id: 'Pretzel', name: 'Pretzel', price: 2.00, img: 'imgs/pretzel.png' },
        { id: 'Castagne', name: 'Castagne', price: 4.00, img: 'imgs/cast.png' },
    ];

    let currentOrder = [];
    let selectedPaymentMethod = null;

    const productListDiv = document.getElementById('product-list');
    const orderSummaryUl = document.getElementById('order-summary');
    const orderTotalSpan = document.getElementById('order-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const purchaseHistoryUl = document.getElementById('purchase-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // --- Rendering Prodotti ---
    function renderProducts() {
        productListDiv.innerHTML = '';
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            productItem.dataset.productId = product.id;
            productItem.innerHTML = `
                <img src="${product.img}" alt="${product.name}">
                <h4>${product.name}</h4>
                <p>€${product.price.toFixed(2)}</p>
            `;
            productItem.addEventListener('click', () => addProductToOrder(product));
            productListDiv.appendChild(productItem);
        });
    }

    // --- Gestione Ordine ---
    function addProductToOrder(product) {
        const existingItem = currentOrder.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            currentOrder.push({ ...product, quantity: 1 });
        }
        renderOrderSummary();
    }

    function renderOrderSummary() {
        orderSummaryUl.innerHTML = '';
        let total = 0;

        if (currentOrder.length === 0) {
            orderSummaryUl.innerHTML = '<li class="empty-order">Nessun articolo nel tuo ordine.</li>';
        } else {
            currentOrder.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name} x ${item.quantity}</span>
                    <span>
                        €${(item.price * item.quantity).toFixed(2)}
                        <button class="decrease-btn" data-id="${item.id}">–</button>
                        <button class="increase-btn" data-id="${item.id}">+</button>
                        <button class="remove-item-btn" data-id="${item.id}">X</button>
                    </span>
                `;
                orderSummaryUl.appendChild(li);
                total += item.price * item.quantity;
            });
        }

        orderTotalSpan.textContent = `€${total.toFixed(2)}`;

        // Eventi per +, -, X
        document.querySelectorAll('.increase-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const product = currentOrder.find(p => p.id === event.target.dataset.id);
                product.quantity++;
                renderOrderSummary();
            });
        });

        document.querySelectorAll('.decrease-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const product = currentOrder.find(p => p.id === event.target.dataset.id);
                if (product.quantity > 1) {
                    product.quantity--;
                } else {
                    currentOrder = currentOrder.filter(p => p.id !== product.id);
                }
                renderOrderSummary();
            });
        });

        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                currentOrder = currentOrder.filter(p => p.id !== event.target.dataset.id);
                renderOrderSummary();
            });
        });
    }

    // --- Metodo di Pagamento ---
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPaymentMethod = btn.dataset.method;
        });
    });

    // --- Conferma Ordine ---
    placeOrderBtn.addEventListener('click', () => {
        if (currentOrder.length === 0) {
            alert('Il tuo ordine è vuoto!');
            return;
        }

        if (!selectedPaymentMethod) {
            alert('Seleziona un metodo di pagamento!');
            return;
        }

        const total = parseFloat(orderTotalSpan.textContent.replace('€', ''));
        let message = `Riepilogo ordine\nTotale: €${total.toFixed(2)}\nPagamento: ${selectedPaymentMethod}`;

        if (selectedPaymentMethod === 'Contanti') {
            const amountGiven = parseFloat(prompt(`Il totale è €${total.toFixed(2)}.\nInserisci quanto ha dato il cliente:`));
            if (!isNaN(amountGiven) && amountGiven >= total) {
                const change = amountGiven - total;
                message += `\nImporto ricevuto: €${amountGiven.toFixed(2)}\nResto: €${change.toFixed(2)}`;
            } else {
                alert('Importo non valido. Ordine annullato.');
                return;
            }
        }

        const purchase = {
            id: Date.now(),
            items: JSON.parse(JSON.stringify(currentOrder)),
            total: total,
            paymentMethod: selectedPaymentMethod,
            timestamp: new Date().toLocaleString()
        };

        savePurchaseToHistory(purchase);
        alert(message);
        currentOrder = [];
        renderOrderSummary();
    });

    function savePurchaseToHistory(purchase) {
        const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
        history.unshift(purchase);
        localStorage.setItem('purchaseHistory', JSON.stringify(history));
        renderPurchaseHistory();
    }

    function exportHistoryToCSV() {
        const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
        if (history.length === 0) {
            alert("Nessuna cronologia acquisti da esportare.");
            return;
        }

        let csv = "Data e Ora,Articoli,Totale,Metodo di Pagamento\n";
        history.forEach(p => {
            let items = p.items.map(i => `${i.name} (x${i.quantity})`).join(" | ");
            csv += `"${p.timestamp}","${items}",${p.total.toFixed(2)},${p.paymentMethod}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "cronologia_acquisti.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    document.getElementById('export-csv-btn').addEventListener('click', exportHistoryToCSV);

    function renderPurchaseHistory() {
        purchaseHistoryUl.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');

        if (history.length === 0) {
            purchaseHistoryUl.innerHTML = '<li class="empty-history">Nessun acquisto precedente.</li>';
        } else {
            history.forEach(purchase => {
                const li = document.createElement('li');
                let itemsList = purchase.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
                li.innerHTML = `
                    <strong>${purchase.timestamp}</strong><br>
                    Articoli: ${itemsList}<br>
                    Totale: €${purchase.total.toFixed(2)} (${purchase.paymentMethod})
                `;
                purchaseHistoryUl.appendChild(li);
            });
        }
    }

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Vuoi davvero cancellare tutta la cronologia acquisti?')) {
            localStorage.removeItem('purchaseHistory');
            renderPurchaseHistory();
        }
    });

    // --- Inizializzazione ---
    renderProducts();
    renderOrderSummary();
    renderPurchaseHistory();
});