class Creature {
    constructor(x, y, index, dna) {

      this.dna=dna
      if(this.dna){
        this.diet=dna[0];
        this.role = round(dna[0]);
        this.color = lerpColor(color("#00ff00"), color("#ff0000"), this.diet) 
        this.maxSpeed = dna[1];

        if(this.maxSpeed<0.5){
          this.maxSpeed = 0.5;
        }

        this.maxEnergy = (800/(this.maxSpeed)/1.5)+100 //(800/(this.maxSpeed)/1.65)+100 works
        this.energy = this.maxEnergy
        console.log(this.maxEnergy)

        if(this.role==1){
          this.maxSpeed*=1.2
          this.maxSpeed+=1
        }else{
          this.maxSpeed*=1.1
        }
      }else{
        this.role=2
        this.energy = 400;
        }

      this.pos = createVector(x, y);
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      this.maxForce = 0.1;
      this.r = 16;
  
      this.wanderTheta = PI / 2;
      this.xoff = random(0, 100);
  
      this.currentPath = [];
      this.paths = [this.currentPath];
      this.state = 0;
      this.closeNum=0;
      this.age=0;
      this.index=index;
    }
  
    wander() {
    if(this.edges()){}
    else{
        let angle = noise(this.xoff) * TWO_PI * 2;
        let steer = p5.Vector.fromAngle(angle);
        steer.setMag(this.maxForce/4);
        this.applyForce(steer);
        this.xoff += 0.01;
        this.state=0;
    }
    }

    separation(other) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      return (d < 50);
    }

    isTouching(other) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      return (d < 25);
    }

    canSee(other) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      return (d < 200);
    }
  
    evade(creature) {
        if(this.edges()){}
        else{

      let target = creature.pos.copy();
      let prediction = creature.vel.copy();
      prediction.mult(10);
      target.add(prediction);
      let pursuit = this.seek(target);
      pursuit.mult(-1);
      this.applyForce(pursuit);
        }
        this.state=1;
    }
  
    pursue(creature) {
        if(this.edges()){}
        else{
        let target = creature.pos.copy();
        let prediction = creature.vel.copy();
        prediction.mult(10);
        target.add(prediction);
        let pursuit = this.seek(target);
        this.applyForce(pursuit);
        }
        this.state=2;
    }

    edges(){
        if (this.pos.x > (worldSize/2-30)) {
            let target = createVector(-this.maxSpeed, this.vel.y);
            let steer = p5.Vector.sub(target, this.vel);
            steer.setMag(this.maxForce);
            this.applyForce(steer);
            return true
        }
        if (this.pos.x < -(worldSize/2-30)) {
            let target = createVector(this.maxSpeed, this.vel.y);
            let steer = p5.Vector.sub(target, this.vel);
            steer.setMag(this.maxForce);
            this.applyForce(steer);
            return true
        }
        if (this.pos.y > (worldSize/2-30)) {
            let target = createVector(this.vel.x, -this.maxSpeed);
            let steer = p5.Vector.sub(target, this.vel);
            steer.setMag(this.maxForce);
            this.applyForce(steer);
            return true
        }
        if (this.pos.y < -(worldSize/2-30)) {
            let target = createVector(this.vel.x, this.maxSpeed);
            let steer = p5.Vector.sub(target, this.vel);
            steer.setMag(this.maxForce);
            this.applyForce(steer);
            return true
        }else false
    }
  
    arrive(target) {
      // 2nd argument true enables the arrival behavior
      return this.seek(target, true);
    }
  
    flee(target) {
      return this.seek(target).mult(-1);
    }

    separate(other) {
      let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
      let steer = this.seek(other).mult(-1)
      //steer = steer.div(d)
      return steer;
    }
  
    seek(target, arrival = false) {
      let force = p5.Vector.sub(target, this.pos);
      let desiredSpeed = this.maxSpeed;
      if (arrival) {
        let slowRadius = 30;
        let distance = force.mag();
        if (distance < slowRadius) {
          desiredSpeed = map(distance, 0, slowRadius, this.maxSpeed/5, this.maxSpeed);
        }
      }
      force.setMag(desiredSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce);
      return force;
    }
  
    applyForce(force) {
      this.acc.add(force);
    }
  
    update() {
      if(this.energy>0){
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
        this.energy--;
        this.age++;
      }
    }

    behaviour(closestHerbivore, closestPredator, closestGrass){

      if (this.role==0){

        this.color=lerpColor(color("#00ff00"), color("#ff0000"), this.diet-0.3) 
        this.color = lerpColor(color("#ffffff"),color(this.color), this.energy/this.maxEnergy) 

        if (closestHerbivore && this.separation(closestHerbivore)) {
          this.evade(closestHerbivore)
        }

        if (closestGrass){
    
        if (this.energy< this.maxEnergy*0.66 && this.canSee(closestGrass)) {
          this.applyForce(this.seek(closestGrass.pos, false))
        }
    
        if (this.isTouching(closestGrass) && this.energy<this.maxEnergy*0.66) {
          this.energy+=150;
          grass[closestGrass.index].energy=0;
          replicate(this)
        }

      }

        if (closestPredator){

          if (this.isTouching(closestPredator)) {
            this.age=10000;
            this.energy=0;
            console.log("gnam2")
          }
  
          if (this.canSee(closestPredator)) {
            this.color = lerpColor(color(this.color), color("#ffff00"), 0.4) 
            this.evade(closestPredator)
            
          }

        }

      }else if (this.role==1){

        this.color=lerpColor(color("#00ff00"), color("#ff0000"), this.diet+0.3) 
        this.color = lerpColor(color("#ffffff"), color(this.color), this.energy/this.maxEnergy) 

        if(closestHerbivore){
          if (this.canSee(closestHerbivore) && this.energy<this.maxEnergy) {
            //this.color = lerpColor(color(this.color), color("#ff5599"), 0.2) 
            this.pursue(closestHerbivore) 
          }
      
          if (this.isTouching(closestHerbivore)) {
            this.energy+=closestHerbivore.maxEnergy*1.5;
            replicate(this)
            this.color =color("#ffffff")
    
            console.log("gnam1")
          }
        }
    }
  
    }


  
    show() {

      if(this.dna){
      stroke(255);
      strokeWeight(2);

      push()
      translate(this.pos.x, -15, this.pos.y);
      let scaling = this.age/400;
      if(scaling<0.55){scaling=0.55}else if(scaling>1){scaling=1}
      scale((this.maxEnergy/400)*scaling)



      
      push();
      noStroke();
      fill(0);
      rotateY(-this.vel.heading()-0.3);
      translate(10, 0, 0);
      if(scaling<0.8){
        scale(2)
      }
      sphere(2,3,3);
      pop()

      push();
      noStroke();
      fill(0);
      rotateY(-this.vel.heading() +0.3);
      translate(10, 0, 0);
      if(scaling<0.8){
        scale(2)
      }
      sphere(2,3,3);
      pop()


      push()
      noStroke();

      fill(color(this.color));
      
      translate(0, 0, 0);
      sphere(10,8,8);
      pop();

      pop();  
  
    }else{
      push()
      translate(this.pos.x, -20/2, this.pos.y);
      fill("#00ff00");
      noStroke();
      scale(1, this.age/200 +0.2, 1);
      cylinder(4,20,4,1)
      pop()
    }


    }
  }
  
  class Target extends Creature {
    constructor(x, y) {
      super(x, y);
      this.vel = p5.Vector.random2D();
      this.vel.mult(5);
    }
  
    show() {
      stroke(255);
      strokeWeight(2);
      fill("#F063A4");
      push();
      translate(this.pos.x, this.pos.y);
      circle(0, 0, this.r * 2);
      pop();
    }
  }