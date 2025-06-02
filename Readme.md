# Backend Project

## Overview

This project is a robust backend service for a media/content platform, developed by **Ambadas Joshi**. It demonstrates industry-standard backend concepts including authentication, error handling, modular architecture, MongoDB data modeling, and CI/CD automation.

---

## Features

- **User Authentication:** JWT-based login, logout, password change, and token refresh.
- **User Profiles:** Update profile, avatar, cover image, and fetch channel information.
- **Media Management:** Videos, comments, likes, playlists, tweets.
- **Subscriptions:** Channel subscription system.
- **Watch History:** Track and retrieve user video watch history.
- **Error Handling:** Uniform API error and response structure.
- **MongoDB Aggregations:** Advanced data fetching using aggregation pipelines.
- **CI/CD:** Automated testing workflow with GitHub Actions.
- **Cloud Uploads:** Media upload via Cloudinary.
- **Pagination:** Efficient pagination for large data sets using plugins.

---

## Database Model

![image1](image1)

<sup>ERD: Models and their relationships (users, videos, playlists, comments, likes, tweets, subscriptions)</sup>

---

## API Error & Response Structure

All API responses and errors follow a consistent structure for easy client handling:

**Success Response Example:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": { /* user fields */ }
  },
  "statusCode": 201
}
```

**Error Response Example:**
```json
{
  "success": false,
  "message": "Username or email already exists",
  "data": null,
  "statusCode": 409
}
```

- All errors are thrown using the `ApiError` class and handled by global error middleware.
- Responses use the `ApiResponse` class for uniformity.

---

## MongoDB Aggregation Pipelines

Complex data queries (such as channel profile, watch history, and subscriber counts) use MongoDB aggregation pipelines for efficiency and flexibility. For example:

```js
const channel = await User.aggregate([
  { $match: { username: username?.toLowerCase() } },
  { $lookup: { from: "subscriptions", localField: "_id", foreignField: "channel", as: "subscribers" }},
  { $lookup: { from: "subscriptions", localField: "_id", foreignField: "subscriber", as: "subscribeTo" }},
  { $addFields: {
      subscribersCount: { $size: "$subscribers" },
      channelSubscribedToCount: { $size: "$subscribeTo" },
      isSubscribed: {
        $cond: { if: { $in: [req.user?._id, "$subscribeTo.subscriber"] }, then: true, else: false }
      }
    }
  },
  { $project: { fullName: 1, username: 1, avatar: 1, coverImage: 1, subscribersCount: 1, channelSubscribedToCount: 1, isSubscribed: 1 } }
])
```

Pagination in aggregations is handled with `mongoose-aggregate-paginate-v2`.

---

## Tech Stack & Dependencies

**Main Frameworks & Libraries:**
- express
- mongoose
- jsonwebtoken
- bcrypt
- dotenv
- cloudinary
- multer
- cors
- cookie-parser
- mongoose-aggregate-paginate-v2

**Development Dependencies:**
- nodemon
- prettier

**See `package.json` for full details.**

---

## Project Structure

```
src/
  controllers/
  models/
  routes/
  middlewares/
  utils/
  db/
  app.js
  index.js
.github/
  workflows/
    ci.yml
```

---

## Setup & Running

1. **Clone the repo:**
   ```
   git clone https://github.com/Amba34/Backend.git
   cd Backend
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file based on `.env.example` (if provided)
   - Set MongoDB URL, JWT secrets, Cloudinary credentials, etc.

4. **Run in development:**
   ```
   npm run dev
   ```

5. **Run tests (if available):**
   ```
   npm test
   ```

---

## CI/CD

- **GitHub Actions**: Workflow is set up to run tests on every push and PR to `main`. See `.github/workflows/ci.yml`.

---


## Author

- **Name**: Ambadas Joshi
- **Role**: Backend Developer
