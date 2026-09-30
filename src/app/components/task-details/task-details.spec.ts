import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';

describe('TaskDetailsComponent', () => {
  beforeEach(() => {
    localStorage.removeItem('tasks');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes, withComponentInputBinding()),
      ],
    });
  });

  afterEach(() => {
    localStorage.removeItem('tasks');
  });

  it('opens a created task from the board and returns back', async () => {
    const harness = await RouterTestingHarness.create('/');

    clickButton(harness.routeNativeElement, 'Добавить задачу');
    await harness.fixture.whenStable();

    setControlValue(
      harness.routeNativeElement?.querySelector('#task-title') ?? null,
      'Новая задача',
    );
    setControlValue(
      harness.routeNativeElement?.querySelector('#task-description') ?? null,
      'Короткое описание',
    );
    clickButton(harness.routeNativeElement, 'Добавить');
    await harness.fixture.whenStable();

    const link = harness.routeNativeElement?.querySelector('a.task');
    expect(link?.textContent).toContain('Новая задача');

    if (!(link instanceof HTMLAnchorElement)) {
      throw new Error('Task card link not found');
    }

    link.click();
    await harness.fixture.whenStable();

    const details = harness.routeNativeElement;
    expect(details?.querySelector('h1')?.textContent).toContain('Новая задача');
    expect(details?.textContent).toContain('Короткое описание');
    expect(details?.textContent).toContain('Не готово');
    expect(details?.textContent).not.toContain('todo');

    const back = details?.querySelector('a.details__back');
    expect(back?.textContent?.trim()).toBe('Назад к задачам');
    expect(back?.getAttribute('href')).toBe('/');

    if (!(back instanceof HTMLAnchorElement)) {
      throw new Error('Back link not found');
    }

    back.click();
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Доска задач');
    expect(harness.routeNativeElement?.textContent).toContain('Новая задача');
  });

  it('shows a done task with the done treatment', async () => {
    const service = TestBed.inject(TaskService);
    service.addTask('Готовая задача', 'Уже сделано');
    const [task] = service.tasks();
    service.updateTask(task.uuid, { status: TaskStatus.Done });

    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;

    expect(details?.querySelector('h1')?.textContent).toContain('Готовая задача');
    expect(details?.textContent).toContain('Уже сделано');
    expect(details?.textContent).toContain('Готово');
    expect(details?.textContent).not.toContain('done');
    expect(details?.querySelector('.details__card--done')).not.toBeNull();
  });

  it('shows a not-found state for an unknown task', async () => {
    const harness = await RouterTestingHarness.create('/tasks/missing-task');
    const details = harness.routeNativeElement;

    expect(details?.textContent).toContain('Задача не найдена');
    expect(details?.querySelector('a.details__back')?.textContent?.trim()).toBe('Назад к задачам');
    expect(details?.querySelector('article')).toBeNull();
  });
});

function clickButton(root: ParentNode | null, label: string): void {
  const button = [...(root?.querySelectorAll('button') ?? [])].find(
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
