import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardComponent } from './task-board';

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;

  beforeEach(async () => {
    localStorage.removeItem('tasks');

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskBoardComponent);
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.removeItem('tasks');
  });

  it('opens the create modal and closes it without saving', async () => {
    clickButton(fixture, 'Добавить задачу');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#task-create-heading')?.textContent).toContain(
      'Добавить задачу',
    );
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();

    clickButton(fixture, 'Отмена');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(TestBed.inject(TaskService).tasks()).toEqual([]);
  });

  it('shows a title error after an invalid submit and keeps the modal open', async () => {
    clickButton(fixture, 'Добавить задачу');
    await fixture.whenStable();

    clickButton(fixture, 'Добавить');
    await fixture.whenStable();

    expect(text(fixture)).toContain('Введите заголовок');
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(TestBed.inject(TaskService).tasks()).toEqual([]);
  });

  it('creates a task through the signal form and closes the modal', async () => {
    clickButton(fixture, 'Добавить задачу');
    await fixture.whenStable();

    setControlValue(fixture.nativeElement.querySelector('#task-title'), 'Новая задача');
    setControlValue(fixture.nativeElement.querySelector('#task-description'), 'Короткое описание');
    clickButton(fixture, 'Добавить');
    await fixture.whenStable();

    const [task] = TestBed.inject(TaskService).tasks();
    expect(task.title).toBe('Новая задача');
    expect(task.description).toBe('Короткое описание');
    expect(task.status).toBe(TaskStatus.Todo);
    expect(task.uuid).toBeTruthy();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(text(fixture)).toContain('Новая задача');
  });
});

function text(fixture: ComponentFixture<TaskBoardComponent>): string {
  return fixture.nativeElement.textContent ?? '';
}

function clickButton(fixture: ComponentFixture<TaskBoardComponent>, label: string): void {
  const button = [...fixture.nativeElement.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  );

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
}

function setControlValue(control: Element | null, value: string): void {
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new Error('Form control not found');
  }

  control.value = value;
  control.dispatchEvent(new Event('input'));
}
