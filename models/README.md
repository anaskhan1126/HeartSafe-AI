# ML Model Files

Place trained model artifacts here:

- `nn_model.pth` — PyTorch neural network weights
- `scaler.pkl` — scikit-learn StandardScaler

## Train models

From the project root (with venv activated):

```powershell
python train_nn.py
```

Requires `processed_heart.csv` in the project root.
