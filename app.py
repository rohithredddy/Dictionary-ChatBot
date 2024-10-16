from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from nltk.stem import PorterStemmer
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# Initialize the stemmer
stemmer = PorterStemmer()

# Load the dictionary CSV file
def load_data():
    if os.path.exists('dictionary.csv'):
        data = pd.read_csv('dictionary.csv')
    else:
        data = pd.DataFrame(columns=['Word', 'Definition'])
    return data

# Save the dictionary back to CSV
def save_data(data):
    data.to_csv('dictionary.csv', index=False)

# Clean dataset and apply stemming to the words
data = load_data()
words = data['Word'].fillna('').str.lower().values  # convert words to lowercase
definitions = data['Definition'].fillna('').values

# Apply stemming to the words
stemmed_words = [stemmer.stem(word) for word in words]

# Vectorize the words for similarity search
vectorizer = TfidfVectorizer()
word_vectors = vectorizer.fit_transform(stemmed_words)

# Define a function to handle word definitions
def get_word_definition(input_word):
    input_word_lower = input_word.lower()  # Lowercase the input for consistency
    input_word_stemmed = stemmer.stem(input_word_lower)

    # Exact match check (case-insensitive)
    if input_word_lower in words:
        idx = list(words).index(input_word_lower)
        return words[idx], definitions[idx]

    # Cosine similarity search if no exact match is found
    input_vector = vectorizer.transform([input_word_stemmed])
    similarities = cosine_similarity(input_vector, word_vectors).flatten()

    # Find the best match based on cosine similarity
    best_match_idx = similarities.argmax()

    # Set a similarity threshold to filter out irrelevant matches
    similarity_threshold = 0.3  # You can adjust this threshold
    if similarities[best_match_idx] >= similarity_threshold:
        return words[best_match_idx], definitions[best_match_idx]

    # No suitable match found
    return None, None

# Route for the main page
@app.route('/')
def home():
    return render_template('index.html')

# API route to process the user's input and generate a response
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')

    word, definition = get_word_definition(user_message)
    if word and definition:
        return jsonify({
            'response': f'"{word}"\nDefinition: "{definition}"'
        })
    else:
        return jsonify({
            'response': 'Word not found. Would you like to add it to the dictionary?',
            'word_not_found': True
        })

# API route to add a new word to the dictionary
@app.route('/add_word', methods=['POST'])
def add_word():
    word = request.json.get('word')
    definition = request.json.get('definition')

    # Add the word to the dataset and re-save the CSV
    new_entry = pd.DataFrame({'Word': [word], 'Definition': [definition]})
    global data, words, definitions, stemmed_words, word_vectors

    data = pd.concat([data, new_entry], ignore_index=True)
    save_data(data)

    # Recompute the vectorizer with the new dataset
    words = data['Word'].str.lower().values  # convert all words to lowercase
    definitions = data['Definition'].values

    # Reapply stemming and vectorization after adding the new word
    stemmed_words = [stemmer.stem(word) for word in words]
    word_vectors = vectorizer.fit_transform(stemmed_words)

    return jsonify({'response': f'The word "{word}" has been added with definition: {definition}.'})

if __name__ == '__main__':
    app.run(debug=True)
