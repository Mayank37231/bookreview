---

# Book Review API

A RESTful API built with Node.js and Express for a simple book review system. This API allows users to sign up, log in, add and retrieve books, and submit, update, and delete their own reviews.

---

## ✨ Features

* **User Authentication (JWT-based):**
    * `POST /api/signup`: Register a new user.
    * `POST /api/login`: Authenticate a user and receive a JSON Web Token (JWT).
* **Books Management:**
    * `POST /api/books`: Add a new book (requires authentication).
    * `GET /api/books`: Retrieve all books with support for pagination and optional filters by `author` and `genre`.
    * `GET /api/books/:id`: Get detailed information for a specific book, including its average rating and paginated reviews.
* **Reviews Management:**
    * `POST /api/books/:bookId/reviews`: Submit a review for a specific book (requires authentication, one review per user per book).
    * `PUT /api/reviews/:id`: Update your own review (requires authentication and ownership).
    * `DELETE /api/reviews/:id`: Delete your own review (requires authentication and ownership).
* **Search Functionality:**
    * `GET /api/books/search?q=query`: Search books by title or author (partial and case-insensitive).

---

## 🗄️ Database Schema (MongoDB/Mongoose)

### User

```javascript
{
    username: String (unique, required),
    email: String (unique, required),
    password: String (hashed, required, select: false), // Password is not returned in queries
    createdAt: Date
}
```

### Book

```javascript
{
    title: String (required),
    author: String (required),
    genre: String (required),
    publicationYear: Number,
    description: String,
    averageRating: Number (default: 0, auto-calculated from reviews, rounded to 1 decimal),
    totalReviews: Number (default: 0, auto-calculated from reviews),
    createdAt: Date
}
```

### Review

```javascript
{
    book: ObjectId (ref: 'Book', required),
    user: ObjectId (ref: 'User', required),
    rating: Number (1-5, required),
    comment: String,
    createdAt: Date,
    updatedAt: Date
}
// Unique compound index on { book: 1, user: 1 } ensures a user can only review a book once.
```

---

## 🔧 Tech Stack

* **Node.js** & **Express.js**: Backend JavaScript runtime and web framework.
* **MongoDB** & **Mongoose**: NoSQL database and Object Data Modeling (ODM) library for Node.js.
* **jsonwebtoken (JWT)**: For secure user authentication.
* **bcryptjs**: For hashing and securing user passwords.
* **dotenv**: To manage environment variables securely.
* **Security & Utility Middleware:**
    * `helmet`: Sets various HTTP headers for security.
    * `express-mongo-sanitize`: Prevents MongoDB Operator Injection.
    * `xss-clean`: Protects against Cross-Site Scripting (XSS) attacks.
    * `hpp`: Prevents HTTP Parameter Pollution.
    * `express-rate-limit`: Limits repeated requests to public APIs.
    * `cookie-parser`: Parses Cookie header and populates `req.cookies`.
    * `morgan`: HTTP request logger middleware for Node.js.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

* Node.js (LTS version recommended)
* npm (comes with Node.js)
* MongoDB (local instance or cloud service like MongoDB Atlas)
* Git

### Project Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/book-review-api.git
    cd book-review-api
    ```
    (Replace `YOUR_USERNAME` with your GitHub username)

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` file:**
    Copy the `.env.example` file and rename it to `.env` in the root of your project:
    ```bash
    cp .env.example .env # For Linux/macOS
    copy .env.example .env # For Windows
    ```
    Then, open the newly created `.env` file and fill in your details:

    ```dotenv
    NODE_ENV=development
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/bookreviewdb # Replace with your MongoDB connection string
    JWT_SECRET=YOUR_VERY_STRONG_AND_RANDOM_JWT_SECRET_KEY # IMPORTANT: Generate a strong, unique secret
    JWT_EXPIRES_IN=1d
    ```
    * **`MONGO_URI`**: If you're using a local MongoDB, `mongodb://localhost:27017/bookreviewdb` is common. For MongoDB Atlas, use your provided connection string.
    * **`JWT_SECRET`**: Generate a strong, random string (e.g., using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`).

### How to Run Locally

```bash
npm start
```

The API will be running on `http://localhost:5000` (or the port you configured in your `.env` file).

---

## 💡 Example API Requests (using `curl`)

Replace `<YOUR_JWT_TOKEN>`, `<BOOK_ID>`, and `<REVIEW_ID>` with actual values obtained from previous requests.

### Authentication

* **Register a new user:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }' http://localhost:5000/api/signup
    ```

* **Login a user:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
        "email": "test@example.com",
        "password": "password123"
    }' http://localhost:5000/api/login
    # Response will include a JWT token in the 'token' field. Copy this token for authenticated requests.
    ```

### Books

* **Add a new book (Authenticated):**
    * *Requires `Authorization: Bearer <token>` header.*
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{
        "title": "The Hitchhiker''s Guide to the Galaxy",
        "author": "Douglas Adams",
        "genre": "Science Fiction",
        "publicationYear": 1979,
        "description": "A comedic science fiction series about interstellar travel."
    }' http://localhost:5000/api/books
    ```

* **Get all books (with pagination and filters):**
    ```bash
    # Get all books (default pagination: page=1, limit=10)
    curl http://localhost:5000/api/books

    # Filter by author and genre, with specific page and limit
    curl "http://localhost:5000/api/books?author=Douglas%20Adams&genre=Science%20Fiction&page=1&limit=5"

    # Sort by title ascending and limit returned fields
    curl "http://localhost:5000/api/books?sort=title&fields=title,author,averageRating"
    ```

* **Get book details by ID (includes average rating and paginated reviews):**
    ```bash
    curl http://localhost:5000/api/books/<BOOK_ID>
    ```

### Reviews

* **Submit a review (Authenticated, one review per user per book):**
    * *Requires `Authorization: Bearer <token>` header.*
    ```bash
    curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{
        "rating": 5,
        "comment": "Absolutely brilliant! A must-read for sci-fi fans."
    }' http://localhost:5000/api/books/<BOOK_ID>/reviews
    ```

* **Update your own review (Authenticated, owner only):**
    * *Requires `Authorization: Bearer <token>` header.*
    ```bash
    curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <YOUR_JWT_TOKEN>" -d '{
        "rating": 4,
        "comment": "Still brilliant, but after a re-read, I found a minor plot point I didn''t quite get."
    }' http://localhost:5000/api/reviews/<REVIEW_ID>
    ```

* **Delete your own review (Authenticated, owner only):**
    * *Requires `Authorization: Bearer <token>` header.*
    ```bash
    curl -X DELETE -H "Authorization: Bearer <YOUR_JWT_TOKEN>" http://localhost:5000/api/reviews/<REVIEW_ID>
    ```

### Search

* **Search books by title or author:**
    ```bash
    # Search by partial title
    curl "http://localhost:5000/api/books/search?q=hitchhiker"

    # Search by partial author name
    curl "http://localhost:5000/api/books/search?q=douglas"
    ```

---

## 📐 Design Decisions & Assumptions

* **RESTful API Principles:** The API adheres to REST architectural principles for clear, resource-based interactions.
* **Stateless Authentication:** JWTs are used for secure, stateless authentication. Tokens are passed in the `Authorization` header as `Bearer <token>`.
* **Secure Passwords:** User passwords are encrypted using `bcryptjs` before being stored in the database.
* **MongoDB & Mongoose:** Chosen for rapid development and flexible data modeling due to its schema-less nature (though Mongoose provides schema validation).
* **Robust Error Handling:** A centralized global error handling middleware ensures consistent and informative error responses (e.g., 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
* **Data Validation:** Basic input validation is enforced via Mongoose schema definitions.
* **Security Hardening:** Essential security middlewares are integrated to protect against common web vulnerabilities like NoSQL injection, XSS, HTTP parameter pollution, and brute-force attacks.
* **API Features Utility:** A reusable `APIFeatures` class simplifies common query operations like pagination, sorting, field limiting, and filtering/searching, promoting cleaner controller code.
* **One Review Per User Per Book:** This constraint is enforced at the database level using a unique compound index on the `Review` model's `book` and `user` fields.
* **Automated Average Rating:** The `averageRating` and `totalReviews` fields on the `Book` model are automatically updated whenever a review for that book is created, modified, or deleted, ensuring data consistency.
* **Flexible Search:** Partial and case-insensitive search queries are supported for book titles and authors using regular expressions.

---
  
