export class ActorType {
    maxHealth;
    walkSpeed;
    runSpeed;
    sprintSpeed;

    constructor(data) {
        Object.assign(this, data);
    }
}
