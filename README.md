# IPL Prediction Intelligence Pro 🏏⚡

A production-grade, technically validated enterprise sports analytics and machine learning platform for the **Indian Premier League (IPL)**.

Delivers real-time first-innings score forecasting, second-innings chase win probability calculations, franchise rivalry analytics, verified cricketer player dossiers from `Players.xlsx`, and comprehensive ML model telemetry benchmarks.

---

## 🌟 Key Features

1. **First Innings Score Forecaster**:
   - Predicts final 20-over totals dynamically based on current runs, wickets lost, overs completed, rolling 5-over momentum, and venue scoring trends.
   - Outputs projected score, **Expected Score Range** ($\pm 8$ runs based on validation RMSE), current run rate (CRR), and over-by-over trajectory worm charts.
   - Accurately converts cricket overs notation into true decimal overs ($10.5 \text{ ov} \implies 10 + 5/6 = 10.8333 \text{ overs}$).

2. **Second Innings Live Win Probability Engine**:
   - Real-time chase outcome probability for batting vs. defending franchises calibrated such that $P(\text{Chasing}) + P(\text{Defending}) = 100.0\%$.
   - Split meters, Required Run Rate (RRR) pressure index, balls remaining, and deterministic outcome guards.

3. **Franchise Rivalry Matrix (Head-to-Head)**:
   - Historical encounter records between canonical IPL franchises.
   - Win share distribution, comparative metric bars (Titles, Win Rate %, Average Score, Highest Score), and match history logs.

4. **Player Scouting & Dossier Directory**:
   - 566 verified cricketers from `Players.xlsx` (no synthetic or fabricated performance records).
   - Date of birth, mathematically derived current age, batting hand, bowling style, and authentic dataset information.

5. **ML Model Telemetry & Tree Feature Importance**:
   - Transparent evaluation telemetry (MAE, RMSE, $R^2$, Accuracy, Precision, Recall, F1, ROC-AUC, Log Loss, Brier Score).
   - Feature importance distributions derived directly from trained model splits.
   - Authoritative `/api/model/info` and `/api/model/dataset-info` registry endpoints.

6. **Audit & Prediction History**:
   - Persistent SQLite audit logging of all generated predictions with relative timestamps, JSON data export, and clear history actions.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────┐
                                  │   Raw IPL Datasets     │
                                  │  matches.csv, deliveries│
                                  │  Players.xlsx          │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │   ETL & Preprocessing  │
                                  │  Canonical Aliasing    │
                                  │  Rolling 5-Over Windows│
                                  └───────────┬────────────┘
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
          ┌───────────────────────────┐               ┌───────────────────────────┐
          │ Score Regressor (1st Inn) │               │  Win Classifier (2nd Inn) │
          │ MLP Neural Net Pipeline   │               │ Gradient Boosting Pipeline│
          │ MAE: 5.09 | R²: 92.07%    │               │ AUC: 99.54% | Acc: 96.91% │
          └─────────────┬─────────────┘               └─────────────┬─────────────┘
                        │                                           │
                        └─────────────────────┬─────────────────────┘
                                              ▼
                                  ┌────────────────────────┐
                                  │  FastAPI REST Backend  │
                                  │  Model Metadata Registry│
                                  │  SQLite Persistence    │
                                  └───────────┬────────────┘
                                              │ HTTP JSON / CORS
                                              ▼
                                  ┌────────────────────────┐
                                  │  React 18 + Vite UI    │
                                  │  Centralized Formatters│
                                  │  Tailwind Sports Theme │
                                  └────────────────────────┘
```

---

## 📊 Verified Model Telemetry

### 1. Score Prediction Models (Holdout Evaluation on 51,255 Ball States)

| Model Architecture | MAE (Runs) | RMSE (Runs) | MSE | $R^2$ Score (%) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **MLP Neural Net** | **5.09** | **8.23** | **67.79** | **92.07%** | **Production Winner** |
| Random Forest Regressor | 5.50 | 8.80 | 77.37 | 90.95% | Evaluated |
| Gradient Boosting Regressor | 8.76 | 12.27 | 150.44 | 82.40% | Evaluated |
| Decision Tree Regressor | 8.71 | 13.87 | 192.43 | 77.48% | Evaluated |
| Linear / Ridge Regression | 13.64 | 18.42 | 339.33 | 60.29% | Baseline |

### 2. Win Probability Models (Holdout Evaluation on 53,558 Chase States)

| Model Architecture | Accuracy | Precision | Recall | F1 Score | ROC-AUC | Log Loss | Brier Score |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Gradient Boosting Classifier** | **96.91%** | **96.49%** | **97.62%** | **97.05%** | **99.54%** | **0.1633** | **0.039** |
| Random Forest Classifier | 92.15% | 92.16% | 92.84% | 92.50% | 97.86% | 0.2905 | 0.081 |
| Logistic Regression | 82.58% | 83.04% | 83.67% | 83.35% | 90.96% | 0.3779 | 0.121 |

---

## ⚙️ Running Locally & Testing

### 1. Backend Server
```bash
# Start FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Development Server
```bash
# Start Vite development server
cd frontend
npm run dev
```

### 3. Automated Test Suites
```bash
# Run all 90 backend unit and integration tests
python -m pytest backend/tests -v
```

---

## ⚠️ Statistical Modeling Disclaimer

Predictions generated by this system are mathematical estimates derived from historical IPL match data (2008–2017) and should not be considered guaranteed outcomes. T20 cricket possesses high inherent volatility influenced by in-match events such as pitch deterioration, boundary edges, fielding errors, and tactical substitutions.
