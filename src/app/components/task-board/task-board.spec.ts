import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Task, TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardSectionComponent } from '../task-board-section/task-board-section';
import { TaskBoardComponent } from './task-board';

describe('TaskBoardComponent', () => {
  let fixture: ComponentFixture<TaskBoardComponent>;

  beforeEach(async () => {
    localStorage.removeItem('tasks');

    await TestBed.configureTestingModule({
      imports: [TaskBoardComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
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

    const link = fixture.nativeElement.querySelector('a.task');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe(`/tasks/${task.uuid}`);
  });

  it('shows the task in the Done column after status changes via drop', async () => {
    await taskServiceSeed(fixture);

    const sections = fixture.debugElement.queryAll(By.directive(TaskBoardSectionComponent));
    const doneSection = sections.find(
      (item) => item.componentInstance.status() === TaskStatus.Done,
    )?.componentInstance;

    if (!doneSection) {
      throw new Error('Board sections not found');
    }

    const [task] = TestBed.inject(TaskService).tasks();
    const event = {
      item: { data: task },
      previousContainer: { data: [] },
      container: { data: [] },
      previousIndex: 0,
      currentIndex: 0,
    } as unknown as CdkDragDrop<Task[]>;

    doneSection['onTaskDropped'](event);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text(fixture)).toContain(task.title);
    const doneLinks = sections
      .find((item) => item.componentInstance.status() === TaskStatus.Done)
      ?.nativeElement.querySelectorAll('a.task');
    expect(doneLinks?.length).toBe(1);
    expect(
      sections
        .find((item) => item.componentInstance.status() === TaskStatus.Todo)
        ?.nativeElement.querySelectorAll('a.task').length,
    ).toBe(0);
  });

  it('filters tasks by title after debounced search input', async () => {
    await taskServiceSeed(fixture);
    clickButton(fixture, 'Добавить задачу');
    await fixture.whenStable();
    setControlValue(fixture.nativeElement.querySelector('#task-title'), 'Другая задача');
    setControlValue(fixture.nativeElement.querySelector('#task-description'), '');
    clickButton(fixture, 'Добавить');
    await fixture.whenStable();

    const searchInput = fixture.nativeElement.querySelector(
      '.board__search-input',
    ) as HTMLInputElement;
    searchInput.value = 'Другая';
    searchInput.dispatchEvent(new Event('input'));
    await debounceWait();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Другая задача');
    expect(text(fixture)).not.toContain('Переносимая задача');
  });

  it('shows a message when search matches no tasks', async () => {
    await taskServiceSeed(fixture);

    const searchInput = fixture.nativeElement.querySelector(
      '.board__search-input',
    ) as HTMLInputElement;
    searchInput.value = 'нет такой задачи';
    searchInput.dispatchEvent(new Event('input'));
    await debounceWait();
    fixture.detectChanges();

    expect(text(fixture)).toContain('Задачи не найдены');
  });
});

async function taskServiceSeed(fixture: ComponentFixture<TaskBoardComponent>): Promise<void> {
  clickButton(fixture, 'Добавить задачу');
  await fixture.whenStable();
  setControlValue(fixture.nativeElement.querySelector('#task-title'), 'Переносимая задача');
  setControlValue(fixture.nativeElement.querySelector('#task-description'), '');
  clickButton(fixture, 'Добавить');
  await fixture.whenStable();
}

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

function debounceWait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

function setControlValue(control: Element | null, value: string): void {
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new Error('Form control not found');
  }

  control.value = value;
  control.dispatchEvent(new Event('input'));
}
