class ApiResponse {
  constructor(success, message, data , statusCode) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode < 400 ? statusCode : 500; // Default to 500 for errors
  }

  static success(message, data = null) {
    return new ApiResponse(true, message, data);
  }

  static error(message) {
    return new ApiResponse(false, message);
  }
}

export { ApiResponse };