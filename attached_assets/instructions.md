# Sofia Restaurant Management

## Project Overview

# Backend

This project is a comprehensive restaurant booking system that enables external services (such as AI agents or other applications) to check table availability and create reservations.

# Frontend

Sofia Admin Dashboard is a secure frontend application for restaurant owners to manage their venues. Built with React, and authentication, it includes an interactive floor plan editor using React-Konva for designing restaurant layouts and much more!

# Features

- **Authentication**: User login, registration, and session management
- **Dashboard**: Overview of restaurant performance metrics
- **Bookings**: Create and manage reservations
- **Schedule**: Configure service hours and availability
- **Customers**: Customer database management
- **Floor Plan Editor**: Interactive editor for creating and managing restaurant layouts
- **Settings**: Application and user settings

1. **Backend API (FastAPI)**: Core booking engine that handles availability checking and reservation creation
2. ** Frontend (React)**: Management interface for restaurant owners (in development)

## Repository Structure

```
/booking_api
│
├── /backend                  # FastAPI backend service
│   ├── main.py               # Main application entry point
│   ├── .env                  # Environment variables
│   ├── /models               # Pydantic data models
│   ├── /routes               # API route handlers
│   ├── /services             # Business logic
│   └── /db                   # Database interactions
│
├── /frontend                 # React frontend

```

## API Endpoints

### Availability Endpoints

- `POST /api/availability/check`: Check table availability based on restaurant, date, time, and party size

### Booking Endpoints

- `POST /api/bookings`: Create a new booking reservation

### Frontend Support Endpoints

- `GET /api/restaurants`: Get list of all restaurants
- `GET /api/restaurants/{restaurant_id}/services`: Get services for a specific restaurant
- `GET /api/restaurants/{restaurant_id}/floor-plans`: Get floor plans for a specific restaurant

## Database Structure
