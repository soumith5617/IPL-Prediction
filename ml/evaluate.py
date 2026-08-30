"""
Evaluation Metrics Module for IPL Prediction System.
Computes and formats regression and classification performance metrics.
"""

from typing import Dict, Any
import numpy as np
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    log_loss,
    brier_score_loss
)

def evaluate_regression(y_true, y_pred) -> Dict[str, float]:
    """Computes MAE, MSE, RMSE, and R2 score for regression models."""
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))

    return {
        "MAE": round(mae, 2),
        "MSE": round(mse, 2),
        "RMSE": round(rmse, 2),
        "R2": round(r2, 4)
    }

def evaluate_classification(y_true, y_pred, y_prob) -> Dict[str, float]:
    """Computes Accuracy, Precision, Recall, F1, ROC-AUC, LogLoss, and Brier Score."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_true, y_prob))
    loss = float(log_loss(y_true, y_prob))
    brier = float(brier_score_loss(y_true, y_prob))

    return {
        "Accuracy": round(acc * 100, 2),
        "Precision": round(prec * 100, 2),
        "Recall": round(rec * 100, 2),
        "F1_Score": round(f1 * 100, 2),
        "ROC_AUC": round(auc, 4),
        "Log_Loss": round(loss, 4),
        "Brier_Score": round(brier, 4)
    }
