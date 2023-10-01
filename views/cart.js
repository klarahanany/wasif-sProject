// Define a function to remove an item from the cart
console.log("what")
function removeItem(itemId) {
    // Find the index of the item to be removed in the cartItems array
    const itemIndex = cartItems.findIndex(item => item.id === itemId);

    // If the item was found in the cartItems array, remove it
    if (itemIndex !== -1) {
        cartItems.splice(itemIndex, 1); // Remove 1 item at the found index
        // You may also want to update the cart on the server here (e.g., using AJAX).
        // For simplicity, we're only removing it from the client-side cart here.
    }

    // Re-render the cart to reflect the updated cartItems
    renderCart();
}

// Function to render the cart after an item is removed
function renderCart() {
    // Select the <ul> element in your HTML where cart items are displayed
    const cartList = document.querySelector('ul');

    // Clear the cart items currently displayed
    cartList.innerHTML = '';

    // Iterate through the updated cartItems and re-render them
    cartItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${item.name}</span>
            <span>${item.price}</span>
            <button onclick="removeItem(${item.id})">Delete</button>
        `;
        cartList.appendChild(listItem);
    });

    // Update the total price if needed
    const totalElement = document.querySelector('.total');
    totalElement.textContent = `Total: $${calculateTotal(cartItems)}`;
}

// Add an event listener to the "Checkout" button (you can implement checkout functionality here)
const checkoutButton = document.querySelector('button');
checkoutButton.addEventListener('click', () => {
    // Implement checkout logic here (e.g., send cart data to the server for processing)
});

// Replace cartItems with your actual cart data (an array of items)
const cartItems = [
    {
        id: 1,
        name: 'Spiritual Tea',
        price: 5.99
    },
    {
        id: 2,
        name: 'Meditation Coffee',
        price: 4.99
    },
    // Add more items as needed
];

// Function to calculate the total price of items in the cart
function calculateTotal(cartItems) {
    return cartItems.reduce((total, item) => total + item.price, 0);
}

// Initial rendering of the cart
renderCart();
