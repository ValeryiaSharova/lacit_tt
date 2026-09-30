export enum TaskStatus {
  Todo = 'todo',
  Done = 'done',
}

export type Task = {
  uuid: string;
  title: string;
  description: string;
  status: TaskStatus;
};
