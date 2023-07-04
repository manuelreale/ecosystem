const worldSize = 1600;

let chart;
let chart2;
let total0;
let total1;
let oldTotal0;
let oldTotal1;
let creatures = [];
let grass = [];
let originalDNA0 =[0.45, 1.50] //diet, speed/size
let originalDNA1 =[0.55, 1.50] //diet, speed/size

function setup() {
  createCanvas(windowWidth, windowHeight/1.5, WEBGL);


  cam = createCamera();
  cam.setPosition(200,-200,300);
  cam.lookAt(0,0,0);

  // let easy = createEasyCam({center:[0,-130,0]});
  // easy.setRotationConstraint(1, 0, 0)
  //document.oncontextmenu = ()=>false;
  noStroke()

  for (let i = 0; i < 90; i++) {
    creatures.push(new Creature(-worldSize/2+random(worldSize), -worldSize/2+random(worldSize),i, originalDNA0));
  }
  for (let i = 0; i < 5; i++) {
    creatures.push(new Creature(-worldSize/2+random(worldSize), -worldSize/2+random(worldSize),i, originalDNA1));
  }

  for (let i = 0; i < 320; i++) {
    grass[i] = new Creature(-worldSize/2+random(worldSize), -worldSize/2+random(worldSize), i);
  }

}

function draw() {

  oldTotal0=total0
  oldTotal1=total1

  total0=0;
  total1=0;

  let database=[]

  orbitControl(2,2,1);
  background(0);
  lights();
  box(worldSize,10,worldSize);


  if(frameCount%60==0){
    console.log(creatures)
  }

  let boundary = new Rectangle(-worldSize/2+random(worldSize), -worldSize/2+random(worldSize), worldSize, worldSize);
  let qtree = new QuadTree(boundary, 2);

  function isAlive(creature) {
    if(creature.dna){
      return (creature.energy > 0 && creature.age<4000);
    }else{
      return (creature.energy > 0 && creature.age<8000);
    }
    
  }
  
  creatures = creatures.filter(isAlive);
  grass = grass.filter(isAlive);

  for (let i=0; i<creatures.length; i++) {

    let value = {x: creatures[i].dna[0], y: creatures[i].dna[1]};
    database.push(value);
    

    if(creatures[i].energy>creatures[i].maxEnergy*0.66){
      //replicate(creatures[i])
    }

    creatures[i].wander();
    creatures[i].update();
    creatures[i].show();

    let point = new Point(creatures[i].pos.x, creatures[i].pos.y, creatures[i]);
    qtree.insert(point);
  }

    if(chart){
      chart.data.datasets[0].data = database;
      // chart.update();
      chart.update('none');
      //console.log(chart.data)
    }


  for (let i=0; i<grass.length; i++) {

    replicate(grass[i])

    grass[i].update();
    grass[i].show();

    grass[i].index=i;

    let point = new Point(grass[i].pos.x, grass[i].pos.y, grass[i]);
    qtree.insert(point);
  }

  for (let i=0; i< creatures.length; i++) {

    if(creatures[i].role==0){
      total0++;
    }else if(creatures[i].role==1){
      total1++;
    }

    let range = new Circle(creatures[i].pos.x, creatures[i].pos.y, 200);
    let points = qtree.query(range);

    let distanceGrass=1000;
    let distancePredator=1000;
    let distanceHerbivore=1000;
    let closestGrass = null;
    let closestPredator = null;
    let closestHerbivore = null;

    for (j=0; j<points.length; j++) {
      let other = points[j].userData;

      if(creatures[i] !== other && other.role == 2 && distanceGrass>dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)){
        distanceGrass = dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)
        closestGrass=other;
      }else if(creatures[i] !== other && other.role == 1 && distancePredator>dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)){
        distancePredator = dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)
        closestPredator=other;
      }else if(creatures[i] !== other && other.role == 0 && distanceHerbivore>dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)){
        distanceHerbivore = dist(creatures[i].pos.x, creatures[i].pos.y, other.pos.x, other.pos.y)
        closestHerbivore=other;
      }
    }

    creatures[i].behaviour(closestHerbivore, closestPredator, closestGrass);

  }

  if(chart2 && frameCount%60==0){
    predators.shift();
    herbivores.shift();
    predators.push(total1);
    herbivores.push(total0);
    chart2.data.datasets[1].data = predators;
    chart2.data.datasets[0].data = herbivores;
    chart2.update('none');
  }
  

}

function replicate(v){
  if(random(0,100)<1 && !v.dna){
    let x= -worldSize/2+random(worldSize);
    let y= -worldSize/2+random(worldSize);
    if(x>-worldSize/2 && x<+worldSize/2 && y>-worldSize/2 && y<+worldSize/2 && grass.length<300){
    grass.push(new Creature(x, y, v.role))
    }
  }

  if(random(0,100)<abs(1-v.role)*10/(0.1+oldTotal0/120)+(v.role*11/(0.1+oldTotal1/20)) && v.dna && v.age>400){
    let x= v.pos.x+random(0,100);
    let y= v.pos.y+random(0,100);

    if(x>-worldSize/2 && x<+worldSize/2 && y>-worldSize/2 && y<+worldSize/2){
      v.dna
      let diet = v.dna[0]+random(-0.02, 0.02)
      if(diet<0){diet=0;}
      else if(diet>1){diet=1}
      let maxSpeed = v.dna[1]+random(-0.1, 0.1)
      if(maxSpeed<0){maxSpeed=0;}
      let dna = [diet, maxSpeed]
      creatures.push(new Creature(x, y, v.role, dna))
      v.energy/=2;
    }
  }
}

function Sphere(radius, x, z){
  let state;
  push()
  fill(250, 0, 0);

  translate(x, -15, z);
  sphere(radius);
  pop()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight/1.5);
}

const quadrants = {
  id: 'quadrants',
  beforeDraw(chart, args, options) {
    const {ctx, chartArea: {left, top, right, bottom}, scales: {x, y}} = chart;
    const midX = x.getPixelForValue(0.5);
    const midY = y.getPixelForValue(1.5);
    ctx.save();
    ctx.fillStyle = options.topLeft;
    ctx.fillRect(left, top, midX - left, midY - top);
    ctx.fillStyle = options.topRight;
    ctx.fillRect(midX, top, right - midX, midY - top);
    ctx.fillStyle = options.bottomRight;
    ctx.fillRect(midX, midY, right - midX, bottom - midY);
    ctx.fillStyle = options.bottomLeft;
    ctx.fillRect(left, midY, midX - left, bottom - midY);
    ctx.restore();
  }
};


let data = {
  datasets: [{
    label: 'DNA distribution',
    data: [{
      x: -10,
      y: 0
    }, {
      x: 0,
      y: 10
    }, {
      x: 10,
      y: 5
    }, {
      x: 0.5,
      y: 5.5
    }],
    backgroundColor: 'rgb(255, 99, 132)'
  }],
};

   chart =  new Chart(
    document.getElementById('scatter'),
    {
      type: 'scatter',
      data: data,
      options: {
        scales: {
          x: {
            type: 'linear',
            position: 'bottom'
          }
        },
        plugins: {
          quadrants: {
            topLeft: "#2a382b",
            topRight: "#5c4644",
            bottomRight: "#2e2322",
            bottomLeft: "#192119",
          }
        }
      },
      plugins: [quadrants]

    }
  );

  var ctx = document.getElementById("stackedLines").getContext("2d");

  const colors = {
    green: {
      fill: '#2a382b',
      stroke: '#5eb84d',
    },
    lightBlue: {
      stroke: '#2a382b',
    },
    darkBlue: {
      fill: '#2e2322',
      stroke: '#916c6a',
    },
    purple: {
      fill: '#2a382b',
      stroke: '#61825f',
    },
  };
  

  let predators = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let herbivores = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
  const xData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  
  chart2 = new Chart(ctx, {
    type: 'line',
    data: {
      labels: xData,
      datasets: [{
        label: "Herbivors",
        fill: true,
        backgroundColor: colors.purple.fill,
        pointBackgroundColor: colors.purple.stroke,
        borderColor: colors.purple.stroke,
        pointHighlightStroke: colors.purple.stroke,
        borderCapStyle: 'butt',
        data: herbivores,
  
      }, {
        label: "Predators",
        fill: true,
        backgroundColor: colors.darkBlue.fill,
        pointBackgroundColor: colors.darkBlue.stroke,
        borderColor: colors.darkBlue.stroke,
        pointHighlightStroke: colors.darkBlue.stroke,
        borderCapStyle: 'butt',
        data: predators,
      }]
    },
    options: {
      responsive: true,

      scales: {
        y: {
          stacked: true,
          max:300,
        },
        x: {
          display:false,
        }
      },
      animation: {
        duration: 750,
      },
    }
  });



