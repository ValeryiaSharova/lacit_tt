import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Task, TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardSectionComponent } from './task-board-section';

describe('TaskBoardSectionComponent', () => {
  let fixture: ComponentFixture<TaskBoardSectionComponent>;
  let taskService: TaskService;
  let updateTaskSpy: jasmine.Spy;

  const taskTodo: Task = {
    uuid: '11111111-1111-4111-8111-111111111111',
    title: 'Todo задача',
    description: 'Описание',
    status: TaskStatus.Todo,
  };

  const taskDone: Task = {
    uuid: '22222222-2222-4222-8222-222222222222',
    title: 'Done задача',
    description: 'Описание',
    status: TaskStatus.Done,
  };

  beforeEach(async () => {
    localStorage.removeItem('tasks');

    await TestBed.configureTestingModule({
      imports: [TaskBoardSectionComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    taskService = TestBed.inject(TaskService);
    updateTaskSpy = spyOn(taskService, 'updateTask').and.callThrough();

    fixture = TestBed.createComponent(TaskBoardSectionComponent);
    fixture.componentRef.setInput('heading', 'Сделаю');
    fixture.componentRef.setInput('tasks', [taskTodo]);
    fixture.componentRef.setInput('status', TaskStatus.Todo);
    fixture.componentRef.setInput('dropListId', 'task-board-todo');
    fixture.componentRef.setInput('connectedDropListIds', ['task-board-done']);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('tasks');
  });

  function drop(task: Task, targetStatus: TaskStatus): void {
    fixture.componentRef.setInput('status', targetStatus);

    const event = {
      item: { data: task },
      previousContainer: { data: [] },
      container: { data: [] },
      previousIndex: 0,
      currentIndex: 0,
    } as unknown as CdkDragDrop<Task[]>;

    fixture.componentInstance['onTaskDropped'](event);
  }

  it('updates status to Done when a Todo task is dropped onto the Done column', () => {
    drop(taskTodo, TaskStatus.Done);

    expect(updateTaskSpy).toHaveBeenCalledOnceWith(taskTodo.uuid, { status: TaskStatus.Done });
  });

  it('updates status to Todo when a Done task is dropped onto the Todo column', () => {
    drop(taskDone, TaskStatus.Todo);

    expect(updateTaskSpy).toHaveBeenCalledOnceWith(taskDone.uuid, { status: TaskStatus.Todo });
  });

  it('does not update status when a Todo task is dropped within the Todo column', () => {
    drop(taskTodo, TaskStatus.Todo);

    expect(updateTaskSpy).not.toHaveBeenCalled();
  });

  it('does not update status when a Done task is dropped within the Done column', () => {
    drop(taskDone, TaskStatus.Done);

    expect(updateTaskSpy).not.toHaveBeenCalled();
  });

  it('keeps task card navigation to the task details route', async () => {
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a.task');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe(`/tasks/${taskTodo.uuid}`);
  });
});
