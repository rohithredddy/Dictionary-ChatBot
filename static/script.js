document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const modal = document.getElementById('add-word-modal');
    const newWordInput = document.getElementById('new-word');
    const newDefinitionInput = document.getElementById('new-definition');
    const addWordBtn = document.getElementById('add-word-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Function to display messages in the chat
    const displayMessage = (message, isBot) => {
        const messageElement = document.createElement('div');
        messageElement.className=isBot?'msg-container-bot':'msg-container-boy'

        const textElement= document.createElement('div')
        textElement.textContent = isBot ? `${message}` : `${message}`;
        textElement.className = isBot ? 'bot-message' : 'user-message';
        messageElement.appendChild(textElement);

        const imgConatiner=document.createElement('div');
        imgConatiner.className=isBot?'msg-profile-bot':'msg-profile-boy'
        const profileElement = document.createElement('img');
        profileElement.src= isBot?"https://d1tgh8fmlzexmh.cloudfront.net/ccbp-dynamic-webapps/chatbot-bot-img.png":
        "https://d1tgh8fmlzexmh.cloudfront.net/ccbp-dynamic-webapps/chatbot-boy-img.png";
        profileElement.className=isBot?"bot-img":"boy-img";
        imgConatiner.appendChild(profileElement);
        messageElement.appendChild(imgConatiner);

        chatBody.appendChild(messageElement);

        chatBody.scrollTop = chatBody.scrollHeight;
    };

    // Function to send user input to the server and get a response
    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (message === '') return; // Prevent sending empty messages
        
        displayMessage(message, false);
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            displayMessage(data.response, true);

            // If the word is not found, show the modal
            if (data.word_not_found) {
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error communicating with the server:', error);
            displayMessage("Bot: Sorry, there was an error. Please try again.", true);
        }
    };

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    // Allow sending messages with the 'Enter' key
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') sendMessage();
    });

    // Function to add a new word to the dictionary
    const addNewWord = async () => {
        alert("New Word Added")
        const word = newWordInput.value.trim();
        const definition = newDefinitionInput.value.trim();

        if (word === '' || definition === '') {
            alert("Please provide both a word and a definition.");
            return;
        }

        try {
            const response = await fetch('/add_word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word, definition })
            });
            const data = await response.json();
            displayMessage(data.response, true);

            // Close modal
            modal.style.display = 'none';
            newWordInput.value = '';
            newDefinitionInput.value = '';
        } catch (error) {
            console.error('Error adding the word:', error);
            // displayMessage("Bot: Couldn't add the word. Please try again.", true);
        }
    };

    // Add word on button click
    addWordBtn.addEventListener('click', addNewWord);

    // Close modal on button click
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});
