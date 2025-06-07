// scripts.js - Funcionalidades para TRENDSTEP

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar el carrito desde localStorage o crear uno vacío
    let cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    updateCartCounter();

    // Funcionalidad para agregar productos al carrito
    document.querySelectorAll('.btn-outline-primary').forEach(button => {
        button.addEventListener('click', function(e) {
            if (e.target.classList.contains('add-to-cart') || this.classList.contains('add-to-cart')) return;
            
            const productCard = this.closest('.card');
            const product = {
                id: productCard.dataset.productId || generateProductId(productCard),
                name: productCard.querySelector('.card-title').textContent.trim(),
                price: parseFloat(productCard.querySelector('.text-primary').textContent.replace('$', '').replace(',', '')),
                image: productCard.querySelector('img').src,
                category: productCard.closest('[data-category]')?.dataset.category || 'unknown',
                quantity: 1
            };

            addToCart(product);
            showAddToCartAlert(product.name);
        });
    });

    // Funcionalidades específicas para la página del carrito
    if (document.querySelector('#cart-table')) {
        renderCartItems();
        setupCartEventListeners();
        updateOrderSummary();
    }

    // Mostrar alerta de compra exitosa si viene de checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('checkout_success')) {
        showPurchaseSuccessAlert();
    }
});

// Función para generar un ID de producto si no existe
function generateProductId(productCard) {
    return 'prod-' + Math.random().toString(36).substr(2, 9);
}

// Función para agregar producto al carrito
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    const existingProduct = cart.find(item => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push(product);
    }

    localStorage.setItem('trendstepCart', JSON.stringify(cart));
    updateCartCounter();
}

// Función para actualizar el contador del carrito
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    const cartCounter = document.querySelector('.cart-counter');
    
    if (cartCounter) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

// Función para mostrar alerta de producto añadido
function showAddToCartAlert(productName) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    alertDiv.style.zIndex = '1100';
    alertDiv.style.transition = 'opacity 0.5s';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        <strong>${productName}</strong> ha sido añadido al carrito
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 500);
    }, 3000);
}

// Funciones específicas para la página del carrito
function renderCartItems() {
    const cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    const cartTableBody = document.querySelector('#cart-table tbody');
    
    if (!cartTableBody) return;

    cartTableBody.innerHTML = '';

    if (cart.length === 0) {
        cartTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-2x mb-3 text-muted"></i>
                    <p class="mb-0">Tu carrito está vacío</p>
                    <a href="index.html" class="btn btn-primary mt-3">Ir a comprar</a>
                </td>
            </tr>
        `;
        document.querySelector('.btn-danger')?.style.setProperty('display', 'none', 'important');
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.productId = item.id;
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image}" alt="${item.name}" width="80" class="me-3">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">${item.category}</small>
                    </div>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="input-group" style="width: 120px;">
                    <button class="btn btn-outline-secondary btn-sm decrease-qty">-</button>
                    <input type="number" class="form-control form-control-sm text-center qty-input" value="${item.quantity}" min="1">
                    <button class="btn btn-outline-secondary btn-sm increase-qty">+</button>
                </div>
            </td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger remove-item">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        cartTableBody.appendChild(row);
    });
}

function setupCartEventListeners() {
    // Aumentar cantidad
    document.querySelector('#cart-table').addEventListener('click', function(e) {
        if (e.target.classList.contains('increase-qty') || e.target.closest('.increase-qty')) {
            const input = e.target.closest('.input-group').querySelector('.qty-input');
            input.value = parseInt(input.value) + 1;
            updateCartItemQuantity(input);
        }
    });

    // Disminuir cantidad
    document.querySelector('#cart-table').addEventListener('click', function(e) {
        if (e.target.classList.contains('decrease-qty') || e.target.closest('.decrease-qty')) {
            const input = e.target.closest('.input-group').querySelector('.qty-input');
            if (parseInt(input.value) > 1) {
                input.value = parseInt(input.value) - 1;
                updateCartItemQuantity(input);
            }
        }
    });

    // Cambio manual de cantidad
    document.querySelector('#cart-table').addEventListener('change', function(e) {
        if (e.target.classList.contains('qty-input')) {
            if (parseInt(e.target.value) > 0) {
                updateCartItemQuantity(e.target);
            } else {
                e.target.value = 1;
            }
        }
    });

    // Eliminar producto
    document.querySelector('#cart-table').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item') || e.target.closest('.remove-item')) {
            const productId = e.target.closest('tr').dataset.productId;
            removeFromCart(productId);
        }
    });

    // Vaciar carrito
    document.querySelector('.btn-danger')?.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres vaciar tu carrito?')) {
            localStorage.removeItem('trendstepCart');
            renderCartItems();
            updateOrderSummary();
            updateCartCounter();
        }
    });

    // Proceder al pago
    document.querySelector('.btn-primary')?.addEventListener('click', function(e) {
        e.preventDefault();
        const cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
        
        if (cart.length === 0) {
            alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
            return;
        }

        // Simulación de proceso de pago
        localStorage.removeItem('trendstepCart');
        window.location.href = 'carrito.html?checkout_success=true';
    });
}

function updateCartItemQuantity(input) {
    const productId = input.closest('tr').dataset.productId;
    const newQuantity = parseInt(input.value);
    let cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];

    const productIndex = cart.findIndex(item => item.id === productId);
    if (productIndex !== -1) {
        cart[productIndex].quantity = newQuantity;
        localStorage.setItem('trendstepCart', JSON.stringify(cart));
        updateOrderSummary();
        updateCartCounter();
        
        // Actualizar el total de la fila
        const price = cart[productIndex].price;
        input.closest('tr').querySelector('td:nth-child(4)').textContent = `$${(price * newQuantity).toFixed(2)}`;
    }
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('trendstepCart', JSON.stringify(cart));
    renderCartItems();
    updateOrderSummary();
    updateCartCounter();
}

function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('trendstepCart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 5.99 : 0; // Costo de envío fijo
    const total = subtotal + shipping;

    document.querySelector('#subtotal span:last-child').textContent = `$${subtotal.toFixed(2)}`;
    document.querySelector('#shipping span:last-child').textContent = `$${shipping.toFixed(2)}`;
    document.querySelector('#total span:last-child').textContent = `$${total.toFixed(2)}`;
    document.querySelector('#item-count').textContent = `${cart.reduce((sum, item) => sum + item.quantity, 0)} ${cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'producto' : 'productos'}`;
}

function showPurchaseSuccessAlert() {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    alertDiv.style.zIndex = '1100';
    alertDiv.style.transition = 'opacity 0.5s';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-check-circle fa-2x me-3"></i>
            <div>
                <h4 class="alert-heading mb-1">¡Compra exitosa!</h4>
                <p class="mb-0">Gracias por tu compra. Tu pedido ha sido procesado correctamente.</p>
            </div>
        </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);

    // Limpiar el parámetro de la URL
    window.history.replaceState({}, document.title, window.location.pathname);
}