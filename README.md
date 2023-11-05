# LSTM Time Series Forecasting

This code demonstrates how to use Long Short-Term Memory (LSTM) neural networks to forecast time series data. The example provided uses Python with libraries such as NumPy, Pandas, Matplotlib, Scikit-Learn, and TensorFlow.

## Requirements

Before using this code, make sure you have the following Python libraries installed:

- [NumPy](https://numpy.org/)
- [Pandas](https://pandas.pydata.org/)
- [Matplotlib](https://matplotlib.org/)
- [Scikit-Learn](https://scikit-learn.org/stable/)
- [TensorFlow](https://www.tensorflow.org/) (version 2.x)
- [Keras](https://keras.io/) (a part of TensorFlow)

You can install these libraries using pip:

```bash
pip install numpy pandas matplotlib scikit-learn tensorflow
```

## Usage

1. Clone or download this repository to your local machine.

2. Create a CSV file with your time series data and update the file path in the code to load your data. The provided code reads a CSV file with a 'gti' column, but you should adjust it based on your dataset.

3. Configure the sequence and target lengths to match your specific forecasting problem. The example code uses a sequence length of 24 hours and a target length of one month (720 hours).

   ```python
   sequence_length = 24  # Length of the input sequence (past 24 hours)
   target_length = 24 * 30  # Length of the target sequence (next month)

4. Train the LSTM model:

- Create sequences of data for input and target.
- Normalize the data to the range [0, 1].
- Split the data into training and testing sets.
- Build and train the LSTM model with the desired architecture. The example code uses a simple architecture with one LSTM layer and one Dense layer.

   ```python
  model = Sequential()
  early_stopping = EarlyStopping(monitor='loss', patience=5, restore_best_weights=True)
  model.add LSTM(50, activation='relu', input_shape=(sequence_length, 1))
  model.add(Dense(target_length))
  model.compile(optimizer=Adam(learning_rate=0.001), loss='mean_squared_error')
  model.fit(X_train, y_train, callbacks=[early_stopping], epochs=100, batch_size=32)
  model.save('lstm_1week_month_all.h5')
  
5. Load the trained model and make predictions. The code then plots the predictions against the actual values.

  ```python
  from keras.models import load_model
  model = load_model('lstm_1week_month_all.h5')
  prediction = model.predict(X_test)
  size = 50
  plt.plot(range(size), prediction[-size:, 0], label='Predicted')
  plt.plot(range(size), y_test[-size:, 0], label='Actual')
  plt.legend()
  plt.xlabel('Time')
  plt.ylabel('Value')
  plt.savefig('lstm_1week_month_all.png')
  plt.show()
