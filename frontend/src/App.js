import React, {Component} from 'react';
import {Provider} from 'react-redux'
import store from './store'

import Adventurizer from './components/containers/Adventurizer.js';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Adventurizer />
      </Provider>
    );
  }
}

export default App;