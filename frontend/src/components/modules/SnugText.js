import React from 'react';

import Util from './../../Util.js';
import config from 'react-global-configuration';

class SnugText extends React.Component {
  constructor(props) {
    super(props);
    this.direction = 0;
    this.state = {
      fontSize: this.props.fontSize,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      outerElement: null,
      innerElement: null,
      done: false
    }
  }
  calculate() {
    if(this.outerElement == null || this.innerElement == null) {
      return;
    }

    this.outerElement.style.display = "block";
    this.outerElement.style.flex = "1";

    //perform calculations outside of react because of nested update issue
    let innerElementTester = document.createElement("span");
    innerElementTester.style.fontSize = ""+this.state.fontSize+"px";
    innerElementTester.style.display = "inline-block";
    innerElementTester.style.position = "absolute";
    //innerElementTester.style.zIndex = "0";
    innerElementTester.style.top = "0px";
    innerElementTester.style.left = "0px";
    innerElementTester.innerHTML = this.props.testText;
    this.outerElement.appendChild(innerElementTester);

    let outerHeight = this.outerElement.clientHeight;
    let outerWidth = this.outerElement.clientWidth;

    let keepGoing = true;
    let direction = 0;
    let fontSize = this.state.fontSize;
    let innerHeight = null;
    let innerWidth = null;
    while(keepGoing) {
      innerHeight = innerElementTester.clientHeight;
      innerWidth = innerElementTester.clientWidth;
      let newDirection = 0;
      let newFontSize = fontSize;

      if(innerHeight > outerHeight) {
        if(fontSize > this.props.minFontSize) {
          newFontSize--;
          newDirection = -1;
        } else {
          
        }
      } else if(innerHeight < outerHeight) {
        if(fontSize < this.props.maxFontSize) {
          newFontSize++;
          newDirection = 1;
        }
      } else if(innerWidth > outerWidth) {
        if(fontSize > this.props.minFontSize) {
          newFontSize--;
          newDirection = -1;
        } else {
          
        }
      } else if(innerWidth < outerWidth) {
        if(fontSize < this.props.maxFontSize) {
          newFontSize++;
          newDirection = 1;
        }
      }

      if(newFontSize != fontSize) {
        if(direction == 0 || direction == newDirection) {
          direction = newDirection;
          fontSize = newFontSize;
          innerElementTester.style.fontSize = ""+fontSize+"px";
          continue;
        }
      }
      keepGoing = false;
    }

    innerHeight = innerElementTester.clientHeight;
    innerWidth = innerElementTester.clientWidth;
    if(innerHeight > outerHeight) {
      if(fontSize > this.props.minFontSize) {
        fontSize -= 2;
      } else {
        
      }
    } else if(innerWidth > outerWidth) {
      if(fontSize > this.props.minFontSize) {
        fontSize -= 2;
      } else {
        
      }
    }

    innerElementTester.style.fontSize = ""+fontSize+"px";
    innerHeight = innerElementTester.clientHeight;
    innerWidth = innerElementTester.clientWidth;

    let vDiff = outerHeight - innerHeight;
    let vPad = vDiff / 2;
    let hDiff = outerWidth - innerWidth;
    let hPad = hDiff / 2;
    let paddingTop = vPad;
    let paddingBottom = vPad;
    //let paddingLeft = hPad;
    //let paddingRight = hPad;
    let paddingLeft = 0;
    let paddingRight = 0;

    this.outerElement.removeChild(innerElementTester);

    this.setState({
      fontSize: fontSize,
      paddingTop: paddingTop,
      paddingBottom: paddingBottom,
      paddingLeft: paddingLeft,
      paddingRight: paddingRight,
      done: true
    });
    this.props.callback(fontSize);
  }
  componentDidMount() {
    this.calculate();
    window.addEventListener('resize', () => this.calculate());
  }
  componentDidUpdate() {
    this.outerElement.style.display = "inline-block";
    this.outerElement.style.flex = null;
  }
  render() {
    let outerStyle = {
      flex: "1",
      maxHeight: this.props.maxHeight,
      position: "relative"
    }

    let innerStyle = {
      display: "inline-block",
      fontSize: ""+this.state.fontSize+"px",
      paddingLeft: ""+this.state.paddingLeft+"px",
      paddingRight: ""+this.state.paddingRight+"px",
      paddingTop: ""+this.state.paddingTop+"px",
      paddingBottom: ""+this.state.paddingBottom+"px"
    }
    return (
      <div style={outerStyle} ref={ (outerElement) => { this.outerElement = outerElement } }>
        <span style={innerStyle} ref={ (innerElement) => { this.innerElement = innerElement } }>
          <span>
            {this.props.text}
          </span>
        </span>
      </div>
    );
  }
}

export default SnugText;