import { Injectable, signal } from '@angular/core';
import { Task, TaskStatus } from '../models/task';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private static readonly storageKey = 'tasks';

  private readonly tasksSignal = signal<Task[]>(this.loadTasks());

  public readonly tasks = this.tasksSignal.asReadonly();

  public addTask(title: string, description: string): void {
    const task: Task = {
      uuid: crypto.randomUUID(),
      title,
      description,
      status: TaskStatus.Todo,
    };

    this.setTasks([...this.tasksSignal(), task]);
  }

  public updateTask(uuid: string, changes: Partial<Omit<Task, 'uuid'>>): void {
    const tasks = this.tasksSignal();

    this.setTasks(tasks.map((item) => (item.uuid === uuid ? { ...item, ...changes } : item)));
  }

  public deleteTask(uuid: string): void {
    this.setTasks(this.tasksSignal().filter((task) => task.uuid !== uuid));
  }

  private setTasks(tasks: Task[]): void {
    this.tasksSignal.set(tasks);
    localStorage.setItem(TaskService.storageKey, JSON.stringify(tasks));
  }

  private loadTasks(): Task[] {
    const storedTasks = localStorage.getItem(TaskService.storageKey);

    if (!storedTasks) {
      return [];
    }

    return JSON.parse(storedTasks) as Task[];
  }
}
