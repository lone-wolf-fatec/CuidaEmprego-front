// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import horasExtrasReducer from './horasExtrasSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    horasExtras: horasExtrasReducer
  }
});

export default store;
