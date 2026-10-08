# NovaStore - AI-Powered Dynamic Pricing E-Commerce Platform

An intelligent e-commerce web application where sellers can predict customer buying behaviour before setting a product price, powered by a GridSearchCV-tuned Machine Learning model.

---

## Overview

NovaStore is a full-stack e-commerce store built with Flask + HTML/CSS/JS, integrated with a trained SVC (Support Vector Classifier) ML model using GridSearchCV for hyperparameter tuning.

Instead of guessing prices, sellers can:
- Upload a product image
- Set an expected star rating
- Enter a tentative price and discount
- Instantly get a Will Buy / Won't Buy prediction from the ML model before listing the product

---

## Features

- Customer Behaviour Prediction - ML model predicts if a customer will purchase at your price
- Live Product Catalog - Browse, filter by category, sort by price/rating
- Shopping Cart - Add to cart, view subtotal, checkout flow
- Image Upload - Drag and drop product photo upload for sellers
- Interactive Star Rating - Pick expected product rating (1-5 stars)
- Price Slider - Adjust price and discount with real-time ML feedback
- Price Elasticity Curve - See customer drop-off at different price points
- Demographic Breakdown - View which age segments respond to your price
- Sweet-Spot Price Suggestion - AI recommends the optimal listing price

---

## ML Model Details

| Property     | Value                                      |
|--------------|--------------------------------------------|
| Algorithm    | Support Vector Classifier (SVC)            |
| Tuning       | GridSearchCV (cross-validated)             |
| Dataset      | ecommerce_dynamic_pricing_dataset.csv      |
| Notebook     | Untitled1 (1).ipynb                        |
| Saved Model  | model/price_model.joblib                   |

**Features used for prediction:**
- Product price and discount percentage
- Customer age and product category
- Product rating and review count

---

## Project Structure

```
amazon_shopping_app/
|
|-- server.py                              # Flask backend and ML prediction API
|-- train_model.py                         # Model training script (GridSearchCV)
|-- requirements.txt                       # Python dependencies
|-- ecommerce_dynamic_pricing_dataset.csv  # Training dataset
|-- products_db.json                       # Live product database
|-- initial_products.json                  # Seed catalog data
|
|-- model/
|   |-- price_model.joblib                 # Trained ML model
|   |-- model_metadata.json               # Model accuracy and feature info
|
|-- templates/
|   |-- index.html                         # Main storefront page
|
|-- static/
    |-- css/style.css                      # Dark-theme styling and animations
    |-- js/app.js                          # Frontend logic (cart, grid, ML calls)
    |-- uploads/                           # Seller-uploaded product images
```

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/novastore.git
cd novastore/amazon_shopping_app
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Train the ML model
```bash
python train_model.py
```

### 4. Run the server
```bash
python server.py
```

### 5. Open in browser
```
http://127.0.0.1:5000
```

---

## Requirements

```
flask
scikit-learn
pandas
numpy
joblib
```

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | HTML5, CSS3, Vanilla JavaScript   |
| Backend       | Python, Flask                     |
| ML            | scikit-learn (SVC + GridSearchCV) |
| Data          | pandas, numpy                     |
| Model Storage | joblib                            |

---

## How It Works

1. Browse the store catalog as a customer
2. Click List My Product and Check Price to open the Seller Studio
3. Upload your product image and fill in product details
4. Set your tentative price and discount using sliders
5. Hit Check Customer Buying Decision - the ML model predicts instantly
6. Adopt the AI-recommended sweet-spot price or adjust and re-check
7. Publish the product to the live store catalog

---

## License

This project is for educational and demonstration purposes.

Built with Flask and scikit-learn
