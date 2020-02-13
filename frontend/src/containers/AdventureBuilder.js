import React from 'react';

const SortableItem = SortableElement(({value}, {index}) => 
  <li key={`listitem-${value.index}`} className="answerItem">
    <Answer
      key={value.index}
      index={value.index}
      questionIndex={value.questionRef.props.index}
      set={(index, params, noHistory) => value.questionRef.setAnswer(index, params, noHistory)}
      setLink={(params) => value.questionRef.props.setLink(params)}
      params={value}>
    </Answer>
  </li>
);
const SortableList = SortableContainer(({items}) => {
  let answersArray = [];
  for(var i in items) {
    answersArray.push(items[i]);
  }
  return (
    <ul className="answerItems">
      {answersArray.map((value, index) => (
        <SortableItem key={`item-${value.index}`} index={index} value={value} />
      ))}
    </ul>
  );
});

class Answer extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }
  handleDelete() {
    this.props.set(this.props.index, null);
  }
  handleTextUpdate(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params, true);
  }
  handleTextSubmit(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params, false);
  }
  startLink(e) {
    let params = {};
    params['from'] = this.props.questionIndex + "," + this.props.index;
    params['preview'] = true;
    this.props.setLink(params);
  }
  componentDidMount() {
    let params = Object.assign({}, this.props.params);
    params['element'] = this.myRef.current;
    this.props.set(this.props.index, params);
  }
  render() {
    let color = this.props.params.linkedTo != null ? "secondary" : "primary";
    let classNames = "answerInput";
    if(this.props.params.linkedTo != null) {
      //classNames += " linked"
    }
    let SortHandle = sortableHandle(() => 
      <IconButton
        className="handle" 
        edge="start"
        size="small">
        <DragHandle />
      </IconButton>
    );
    return (
      <div>
        <TextField
          className={classNames}
          size="small"
          color={color}
          multiline
          fullWidth
          onChange={(event) => this.handleTextUpdate(event)}
          onBlur={(event) => this.handleTextSubmit(event)}
          value={this.props.params.text}
          placeholder="Choice"
          InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <SortHandle />
              </InputAdornment>,
            endAdornment:
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => this.handleDelete()}
                >
                  <Delete />
                </IconButton>
                <Fab
                  edge="end"
                  size="small"
                  color={color}
                  onClick={(event) => this.startLink(event)}
                >
                  <LinkIcon />
                  <div ref={this.myRef} className="answerPoint"></div>
                </Fab>
              </InputAdornment>
          }}
        />
      </div>
    );
  }
}
class Question extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }
  handleMoveStart(e, data) {
    e.stopPropagation();
    let params = Object.assign({}, this.props.params);
    params['position'] = {
      x: data.x,
      y: data.y
    };
    this.props.set(this.props.index, params);
  }
  handleMoveStop(e, data) {
    e.stopPropagation();
    let params = Object.assign({}, this.props.params);
    params['position'] = {
      x: data.x,
      y: data.y
    };
    this.props.set(this.props.index, params);
  }
  handleDelete() {
    this.props.set(this.props.index, null);
  }
  handleTextSubmit(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params, false);
  }
  handleTextUpdate(e) {
    let params = Object.assign({}, this.props.params);
    params['text'] = e.target.value;
    this.props.set(this.props.index, params, true);
  }
  handleSetAsStart(e) {
    let params = Object.assign({}, this.props.params);
    params['start'] = true;
    this.props.set(this.props.index, params, false);
  }
  handleAddAnswer() {
    this.setAnswer(null, null);
  }
  handleClick(e) {
    e.stopPropagation();
  }
  setAnswer(k, params, noHistory) {
    //const answers = this.props.params.answers.slice();
    const answers = Object.assign({}, this.props.params.answers);
    if(k != null && params == null) {
      //deleting
      //must delete linked question in parent
      delete answers[k];
    } else if(k == null && params == null) {
      //creating
      k = uuidv1();
      //k = this.props.params.answers.length;
      params = {
        text: "",
        index: k,
        questionRef: this
      };
      answers[k] = params;
    } else {
      //updating
      answers[k] = params;
    }
    var pParams = Object.assign({}, this.props.params);
    pParams['answers'] = answers;
    this.props.set(this.props.index, pParams, noHistory);
  }
  onSortEnd = ({oldIndex, newIndex}) => {
    let params = Object.assign({}, this.props.params);
    let answers = Object.assign({}, params['answers']);
    let answersArray = [];
    for(var i in answers) {
      answersArray.push(answers[i]);
    }
    answersArray = arrayMove(answersArray, oldIndex, newIndex);
    let answersNew = {};
    for(var i = 0; i < answersArray.length; i++) {
      answersNew[answersArray[i]['index']] = answersArray[i];
    }
    params['answers'] = answersNew;
    this.props.set(this.props.index, params);
  };
  onSortMove = (event) => {
    this.props.renderVisualizations();
  }
  renderAnswers(answers) {
    let refee = this;

    let c = document.getElementById("app");
    
    return <SortableList items={answers} onSortEnd={this.onSortEnd} onSortMove={this.onSortMove} hideSortableGhost={false} useDragHandle helperContainer={c} />
    
    /*
    let answerComponents = [];
    for(const i in answers) {
      
      answerComponents.push(
        <Answer
          key={i}
          index={i}
          questionIndex={this.props.index}
          set={(i, params, noHistory) => this.setAnswer(i, params, noHistory)}
          setLink={this.props.setLink}
          params={answers[i]}>
        </Answer>
      );
    }
    return answerComponents;
    */
  }
  stopLink() {
    let params = {};
    params['to'] = this.props.index;
    params['preview'] = false;
    this.props.setLink(params);
  }
  previewLink() {
    let params = {};
    params['to'] = this.props.index;
    params['preview'] = true;
    this.props.setLink(params);
  }
  unpreviewLink() {
    let params = {};
    params['to'] = null;
    params['preview'] = true;
    this.props.setLink(params);
  }
  componentDidMount() {
    let params = Object.assign({}, this.props.params);
    params['element'] = this.myRef.current;
    this.props.set(this.props.index, params);
  }
  render() {
    //let answers = this.props.params.answers.slice();
    const answers = Object.assign({}, this.props.params.answers);
    let classNames = "";
    classNames += "question";
    if(typeof(this.props.linking.from) != 'undefined' && this.props.linking.preview) {
      classNames += " linking";
    }
    if(Object.keys(this.props.params.linkedFrom).length > 0) {
      classNames += " linked";
    }
    let startMenuItemClassNames = "";
    if(this.props.params.start == true) {
      classNames += " start";
      startMenuItemClassNames += " hidden";
    }
    return (
      <Draggable
        handle=".handle"
        defaultPosition={null}
        position={this.props.params.position}
        scale={this.props.scale}
        onDrag={(e, data) => this.props.renderVisualizations(e, data)}
        onStart={(e, data) => this.handleMoveStart(e, data)}
        onStop={(e, data) => this.handleMoveStop(e, data)}>
        <Card className={classNames}>
          <div ref={this.myRef}>
            <CardActions>
              <Grid
                justify="space-between"
                container>
                <Grid item>
                  <IconButton size="small" className="handle">
                    <DragHandle />
                  </IconButton>
                </Grid>
                <Grid item>
                  <PopupState variant="popover" popupId="card-popup-menu">
                    {popupState => (
                      <React.Fragment>
                        <IconButton size="small" {...bindTrigger(popupState)}>
                          <MoreVert />
                        </IconButton>
                        <Menu {...bindMenu(popupState)}>
                          <MenuItem className={startMenuItemClassNames} onClick={() => {
                            popupState.close();
                            this.handleSetAsStart();
                          }}>
                            <PlayForWork /> &nbsp; 
                            Set as Starting Point
                          </MenuItem>
                          <MenuItem onClick={() => {
                            popupState.close();
                            this.handleDelete();
                          }}>
                            <Delete /> &nbsp; 
                            Delete
                          </MenuItem>
                        </Menu>
                      </React.Fragment>
                    )}
                  </PopupState>
                </Grid>
              </Grid>
            </CardActions>
            <CardContent>
              <TextField
                color="primary"
                placeholder="Dialog"
                multiline
                fullWidth
                onMouseDown={(event) => this.handleClick(event)}
                onChange={(event) => this.handleTextUpdate(event)}
                onBlur={(event) => this.handleTextSubmit(event)}
                value={this.props.params.text}
              />
              <div>
                {this.renderAnswers(answers)}
                <div>
                  <Button variant="contained" color="primary" size="small" aria-label="add" onClick={() => this.handleAddAnswer()}>
                    <Add /> Add Choice
                  </Button>
                </div>
              </div>
            </CardContent>
            <div className="linkingOverlay" onClick={() => this.stopLink()} onMouseEnter={() => this.previewLink()} onMouseLeave={() => this.unpreviewLink()}>
              <LinkIcon />
            </div>
          </div>
        </Card>
      </Draggable>
    );
  }
}

class AdventureBuilder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          questions: {}
        }
      ],
      stepNumber: 0,
      linking: {},
      menus: {
        main: false,
        user: false
      }
    }
    this.positionX = 0;
    this.positionY = 0;
    this.scale = 1;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
  }
  getOffset(canvas, childrenEl) {
    let canv = canvas.getBoundingClientRect();
    let box = childrenEl.getBoundingClientRect();
  
    return {
        top: box.top - canv.top,
        left: box.left - canv.left,
        width: childrenEl.offsetWidth * this.scale,
        height: childrenEl.offsetHeight * this.scale
    };
  }
  drawArrow(ctx, fromx, fromy, tox, toy) {
    let headlen = 10 * this.scale;
    let angle = Math.atan2(toy-fromy,tox-fromx);
    ctx.beginPath();
    ctx.strokeStyle = theme.palette.secondary.main;
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = 2 * this.scale;
    ctx.stroke();
    ctx.lineWidth = 6 * this.scale;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));
    ctx.stroke();
  }
  
  getCenterCoord(coods) {

    return {
        x: coods.left + coods.width / 2,
        y: coods.top + (coods.height / 2)
    }
  }
  getAngleCoord(r, c, angle) {
    let x, y;
    let rAngle = Math.acos(Math.sqrt(Math.pow(r.left + r.width - c.x, 2)) / Math.sqrt(Math.pow(r.left + r.width - c.x, 2) + Math.pow(r.top - c.y, 2)));
  
    if (angle >= 2 * Math.PI - rAngle || angle < rAngle) {
      x = r.left + r.width;
      y = c.y + Math.tan(angle) * (r.left + r.width - c.x);
    } else {
      if (angle >= rAngle && angle < Math.PI- rAngle) {
        x = c.x - ((r.top - c.y) / Math.tan(angle));
        y = r.top + r.height;
      } else {
        if (angle >= Math.PI - rAngle && angle < Math.PI + rAngle) {
          x = r.left;
          y = c.y - Math.tan(angle) * (r.left + r.width - c.x);
        } else {
          if (angle >= Math.PI + rAngle) {
            x = c.x + ((r.top - c.y) / Math.tan(angle));
            y = r.top;
          }
        }
      }
    }
    return {
      x: x,
      y: y
    };
  }
  getEllipseCoord(r, c, angle) {
    return {
      x: c.x + (r.width / 2) * Math.cos(angle),
      y: c.y + (r.height / 2) * Math.sin(angle)
    };
  }
  
  renderVisualizations() {
    var canvas = document.getElementById("visualizations");
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const questions = Object.assign({}, current.questions);

    for(const i in questions) {
      if(questions[i]['start'] == true && typeof(questions[i]['element']) != 'undefined') {
        let dot = this.getOffset(canvas, questions[i]['element']);
        let c = this.getCenterCoord(dot);

        let textY = c.y - dot.height / 2 - (70 * this.scale);
        //let textX = c.x - 
        let textX = c.x - (dot.width - (80 * this.scale)) / 2 + 160 * this.scale - (30 * this.scale);

        let eleY = textY + (60 * this.scale);
        ctx.beginPath();
        ctx.fillStyle = theme.palette.secondary.main;
        let fontSize = Math.round(22 * this.scale);
        ctx.font = "bold "+fontSize+"px Roboto";
        ctx.fillText('START', textX, textY);
        ctx.fill();
        ctx.closePath();
  
        let fL = c.x;
        let fT = textY + (10 * this.scale);
        let tL = c.x;
        let tT = eleY;

        this.drawArrow(ctx, fL, fT, tL, tT);
      }
      for(const j in questions[i]['answers']) {
        if(questions[i]['answers'][j]['linkedTo'] != null) {
          if(typeof(questions[i]['answers'][j]['element']) == 'undefined') {
            console.log("missing question");
            continue;
          }
          if(typeof(questions[questions[i]['answers'][j]['linkedTo']]) == 'undefined') {
            console.log("missing answer");
            continue;
          }
          let from = questions[i]['answers'][j]['element'];
          let to = questions[questions[i]['answers'][j]['linkedTo']]['element'];
          let dot1 = this.getOffset(canvas, from);
          let dot2 = this.getOffset(canvas, to);
  
          dot2.top -= 8 * this.scale;
          dot2.left -= 8 * this.scale;
          dot2.width += 16 * this.scale;
          dot2.height += 16 * this.scale;
  
          let c1 = this.getCenterCoord(dot1);
          let c2 = this.getCenterCoord(dot2);
          dot1 = this.getEllipseCoord(dot1, c1, Math.atan2(c2.y - c1.y, c2.x - c1.x));
          dot2 = this.getAngleCoord(dot2, c2, Math.atan2(c2.y - c1.y, c2.x - c1.x) + Math.PI);

          let fL = dot1.x;
          let fT = dot1.y;
          let tL = dot2.x;
          let tT = dot2.y;
  
          this.drawArrow(ctx, fL, fT, tL, tT);
        }
      }
    }
    ctx.stroke();
  }
  setQuestion(k, params, noHistory) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const questions = Object.assign({}, current.questions);
    if(typeof(noHistory) == 'undefined') {
      noHistory = false;
    }
    let updateHistory = true;
    //const questions = current.questions.slice();
    if(k != null && params == null) {
      //deleting
      //unlink linked answers
      for(const x in questions[k]['linkedFrom']) {
        var tmp = x.split(",");
        let questionIndex = tmp[0];
        let answerIndex = tmp[1];
        questions[questionIndex]['answers'][answerIndex]['linkedTo'] = null;
      }
      delete questions[k];
    } else if(k == null && params == null) {
      //creating
      k = uuidv1();
      //k = questions.length;
      let x = (-this.positionX + this.viewportWidth / 2) - (200 * this.scale);
      let y = (-this.positionY + this.viewportHeight / 2) - (100 * this.scale);
      x /= this.scale;
      y /= this.scale;
      params = {
        position: {
          x: x,
          y: y
        },
        text: "",
        linking: false,
        linkedFrom: {},
        answers: {},
        start: false
      };
      if(Object.keys(questions).length == 0) {
        params['start'] = true;
      }
      questions[k] = params;
    } else {
      //updating
      //is this just an element update?
      if(typeof(questions[k]['element']) == 'undefined' && typeof(params['element']) != 'undefined') {
        updateHistory = false;
      }
      if(questions[k]['start'] == false && params['start'] == true) {
        for(var i in questions) {
          questions[i]['start'] = false;
        }
      }
      questions[k] = params;
    }
    if(updateHistory && !noHistory) {
      this.setState({
        history: history.concat([
          {
            questions: questions
          }
        ]),
        stepNumber: history.length
      });
    } else {
      history[history.length - 1] = {
        questions: questions
      }
      this.setState({
        history: history,
        stepNumber: history.length - 1
      });
    }
  }
  undo() {
    let s = this.state.stepNumber - 1;
    if(s > -1) {
      this.setState({
        stepNumber: s
      });
    }
  }
  redo() {
    let s = this.state.stepNumber + 1;
    if(s < this.state.history.length) {
      this.setState({
        stepNumber: s
      });
    }
  }
  renderQuestions(questions) {
    let questionComponents = [];
    //check for deletions
    for(const i in questions) {
      for(const x in questions[i]['linkedFrom']) {
        var tmp = x.split(",");
        let questionIndex = tmp[0];
        let answerIndex = tmp[1];
        if(typeof(questions[questionIndex]) == 'undefined' || typeof(questions[questionIndex]['answers'][answerIndex]) == 'undefined' || questions[questionIndex]['answers'][answerIndex]['linkedTo'] != i) {
          //linked answer no longer exists, or does not contain link back - unlink from question
          delete questions[i]['linkedFrom'][x];
        }
      }
    }
    for(const i in questions) {
      questionComponents.push(
        <Question
          key={i}
          index={i}
          set={(i, params, noHistory) => this.setQuestion(i, params, noHistory)}
          setLink={(params) => this.setLink(params)}
          renderVisualizations={(params) => this.renderVisualizations(params)}
          linking={this.state.linking}
          scale={this.scale}
          params={questions[i]}>
        </Question>
      );
    }
    this.questions = questions;
    this.questionComponents = questionComponents;
    return questionComponents;
  }
  setLink = (params) => {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[history.length - 1];
    const questions = Object.assign({}, current.questions);
    let linking = Object.assign({}, this.state.linking);
    if(typeof(params['from']) != 'undefined') {
      //coming from answer
      linking.from = params['from'];
    }
    if(typeof(params['to']) != 'undefined') {
      //coming from question
      if(params['to'] == null) {
        
      } else {
        linking.to = params['to'];
      }
    }
    if(typeof(params['preview']) != 'undefined') {
      //coming from question
      linking.preview = params['preview'];
    }
    if(typeof(linking.from) != 'undefined' && typeof(linking.to) != 'undefined' && params['to'] != null) {
      let q = Object.assign({}, questions[linking.to]);
      q['linkedFrom'][linking.from] = true;
      this.setQuestion(linking.to, q, true);
      let tmp = linking.from.split(",");
      let questionIndex = tmp[0];
      let answerIndex = tmp[1];
      let a = Object.assign({}, questions[questionIndex]['answers'][answerIndex]);
      a['linkedTo'] = linking.to;
      let q2 = Object.assign({}, questions[questionIndex]);
      q2['answers'][answerIndex] = a;
      this.setQuestion(questionIndex, q2, true);
      if(!linking.preview) {
        delete linking.to;
        delete linking.from;
      }
    } else if(params['to'] == null && typeof(linking.to) != 'undefined') {
      //remove link
      let q = Object.assign({}, questions[linking.to]);
      delete q['linkedFrom'][linking.from];
      this.setQuestion(linking.to, q);
      let tmp = linking.from.split(",");
      let questionIndex = tmp[0];
      let answerIndex = tmp[1];
      let a = Object.assign({}, questions[questionIndex]['answers'][answerIndex]);
      a['linkedTo'] = null;
      let q2 = Object.assign({}, questions[questionIndex]);
      q2['answers'][answerIndex] = a;
      this.setQuestion(questionIndex, q2, true);
      delete linking.to;
    } else if(typeof(linking.from) != 'undefined') {

    }
    
    this.setState({
      linking: linking
    });
  }
  componentDidUpdate() {
    this.renderVisualizations();
  }
  displayChanged(e, data) {

    //console.log(e);
    this.positionX = e.positionX;
    this.positionY = e.positionY;
    this.scale = e.scale;

    this.renderVisualizations(e, data);
  }
  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    var disableUndo = this.state.stepNumber > 0 ? false : true;
    var disableRedo = this.state.stepNumber < this.state.history.length - 1 ? false : true;

    let baseOptions = {
      minScale: 0.2,
      maxScale: 1,
      limitToBounds: false,
      centerContent: false
    }
    let panOptions = {
      disabled: false
    }
    let zoomInOptions = {
      step: 70
    }
    let zoomOutOptions = {
      step: 70
    }
    let wheelOptions = {
      step: 100
    }

    const divStyle = {
      marginTop: '64px',
    };
    
    return (
      <div>
        <AppBar color="default" position="fixed" className="secondaryToolbar">
          <Toolbar>
            <Grid
              justify="space-between"
              container>
              <Grid item>
                <Button color="primary" 
                  key="actionAdd"
                  onClick={() => this.setQuestion(null, null)}>
                  <AddBox /> &nbsp; Add
                </Button>
                
                &nbsp;

                <Button color="primary" disabled={disableUndo}
                  key="actionUndo"
                  onClick={() => this.undo()}
                ><Undo /> &nbsp; Undo</Button>
                <Button color="primary" disabled={disableRedo}
                  key="actionRedo"
                  onClick={() => this.redo()}
                ><Redo /> &nbsp; Redo</Button>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        <div className="pane">
          <TransformWrapper 
            onWheel={(e, data) => this.displayChanged(e, data)}
            onPanning={(e, data) => this.displayChanged(e, data)}
            onPinching={(e, data) => this.displayChanged(e, data)}
            onZoomChange={(e, data) => this.displayChanged(e, data)}
            options={baseOptions}
            pan={panOptions} 
            zoomIn={zoomInOptions} 
            zoomOut={zoomOutOptions} 
            wheel={wheelOptions}>
            <TransformComponent>
              <div className="questions">
                {this.renderQuestions(current.questions)}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
        <canvas id="visualizations"></canvas>
      </div>
    );
  }
}

export default AdventureBuilder;