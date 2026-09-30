import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, map } from 'rxjs';
import { Task, TaskStatus } from '../models/task';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  static readonly storageKey = 'tasks';

  private readonly destroyRef = inject(DestroyRef);

  private readonly tasksSignal = signal<Task[]>(this.loadTasks());

  public readonly tasks = this.tasksSignal.asReadonly();

  constructor() {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter((event) => event.key === TaskService.storageKey),
        map((event) => this.tasksFromStorageEvent(event)),
        filter((tasks): tasks is Task[] => tasks !== undefined),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((tasks) => this.applyTasksFromOtherTab(tasks));
  }

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

  private applyTasksFromOtherTab(tasks: Task[]): void {
    this.tasksSignal.set(tasks);
  }

  private tasksFromStorageEvent(event: StorageEvent): Task[] | undefined {
    if (event.newValue === null) {
      return [];
    }

    try {
      return JSON.parse(event.newValue) as Task[];
    } catch {
      return undefined;
    }
  }

  private loadTasks(): Task[] {
    const storedTasks = localStorage.getItem(TaskService.storageKey);

    if (!storedTasks) {
      return [];
    }

    return JSON.parse(storedTasks) as Task[];
  }
}
