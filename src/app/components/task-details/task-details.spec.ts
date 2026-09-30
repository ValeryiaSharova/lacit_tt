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
    expect(details?.querySelector('form')).toBeNull();
    expect(buttonByLabel(details, 'Редактировать')).toBeNull();
    expect(buttonByLabel(details, 'Удалить')).toBeNull();
  });

  it('fills the edit form with the current task and saves changes', async () => {
    const task = seedTask('Исходная', 'Было описание');
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;

    expect(details?.querySelector('form')).toBeNull();

    clickButton(details, 'Редактировать');
    await harness.fixture.whenStable();

    const title = details?.querySelector('#task-edit-title');
    const description = details?.querySelector('#task-edit-description');
    const todo = radioByValue(details, TaskStatus.Todo);
    const done = radioByValue(details, TaskStatus.Done);

    expect(title).toBeInstanceOf(HTMLInputElement);
    expect(description).toBeInstanceOf(HTMLTextAreaElement);
    expect((title as HTMLInputElement).value).toBe('Исходная');
    expect((description as HTMLTextAreaElement).value).toBe('Было описание');
    expect(todo.checked).toBe(true);
    expect(done.checked).toBe(false);
    expect(details?.textContent).toContain('8 / 20');
    expect(details?.textContent).toContain('13 / 200');

    setControlValue(title ?? null, 'Новый заголовок');
    setControlValue(description ?? null, 'Новое описание');
    done.click();
    await harness.fixture.whenStable();

    expect(todo.checked).toBe(false);
    expect(done.checked).toBe(true);

    clickButton(details, 'Сохранить');
    await harness.fixture.whenStable();

    expect(details?.querySelector('form')).toBeNull();
    expect(details?.querySelector('h1')?.textContent).toContain('Новый заголовок');
    expect(details?.textContent).toContain('Новое описание');
    expect(details?.textContent).toContain('Готово');
    expect(details?.querySelector('.details__card--done')).not.toBeNull();

    const updated = TestBed.inject(TaskService)
      .tasks()
      .find((item) => item.uuid === task.uuid);
    expect(updated).toEqual({
      uuid: task.uuid,
      title: 'Новый заголовок',
      description: 'Новое описание',
      status: TaskStatus.Done,
    });
  });

  it('discards edit form changes on cancel and reloads current values', async () => {
    const task = seedTask('Исходная', 'Было описание', TaskStatus.Done);
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;
    const service = TestBed.inject(TaskService);

    clickButton(details, 'Редактировать');
    await harness.fixture.whenStable();

    expect(radioByValue(details, TaskStatus.Done).checked).toBe(true);

    setControlValue(details?.querySelector('#task-edit-title') ?? null, 'Черновик');
    setControlValue(details?.querySelector('#task-edit-description') ?? null, 'Не сохранять');
    radioByValue(details, TaskStatus.Todo).click();
    await harness.fixture.whenStable();

    clickButton(details, 'Отмена');
    await harness.fixture.whenStable();

    expect(details?.querySelector('form')).toBeNull();
    expect(details?.querySelector('h1')?.textContent).toContain('Исходная');
    expect(details?.textContent).toContain('Было описание');
    expect(details?.textContent).toContain('Готово');
    expect(service.tasks().find((item) => item.uuid === task.uuid)).toEqual(task);

    clickButton(details, 'Редактировать');
    await harness.fixture.whenStable();

    expect((details?.querySelector('#task-edit-title') as HTMLInputElement).value).toBe('Исходная');
    expect((details?.querySelector('#task-edit-description') as HTMLTextAreaElement).value).toBe(
      'Было описание',
    );
    expect(radioByValue(details, TaskStatus.Done).checked).toBe(true);
    expect(radioByValue(details, TaskStatus.Todo).checked).toBe(false);
  });

  it('shows title and description errors and does not save an invalid edit', async () => {
    const task = seedTask('Исходная', 'Было описание');
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;
    const service = TestBed.inject(TaskService);

    clickButton(details, 'Редактировать');
    await harness.fixture.whenStable();

    setControlValue(details?.querySelector('#task-edit-title') ?? null, '');
    setControlValue(details?.querySelector('#task-edit-description') ?? null, 'я'.repeat(201));
    clickButton(details, 'Сохранить');
    await harness.fixture.whenStable();

    expect(details?.querySelector('form')).not.toBeNull();
    expect(details?.textContent).toContain('Введите заголовок');
    expect(details?.textContent).toContain('Максимум 200 символов');
    expect(details?.textContent).toContain('0 / 20');
    expect(details?.textContent).toContain('201 / 200');
    expect(service.tasks().find((item) => item.uuid === task.uuid)).toEqual(task);

    setControlValue(details?.querySelector('#task-edit-title') ?? null, 'я'.repeat(21));
    setControlValue(details?.querySelector('#task-edit-description') ?? null, 'Норма');
    clickButton(details, 'Сохранить');
    await harness.fixture.whenStable();

    expect(details?.textContent).toContain('Максимум 20 символов');
    expect(details?.textContent).not.toContain('Максимум 200 символов');
    expect(service.tasks().find((item) => item.uuid === task.uuid)).toEqual(task);
  });

  it('does not show delete while editing', async () => {
    const task = seedTask('На удаление', 'Описание');
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;

    clickButton(details, 'Редактировать');
    await harness.fixture.whenStable();

    expect(buttonByLabel(details, 'Удалить')).toBeNull();
    expect(buttonByLabel(details, 'Редактировать')).toBeNull();
  });

  it('keeps the task when delete confirmation is cancelled', async () => {
    const task = seedTask('Оставить', 'Не удалять');
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const details = harness.routeNativeElement;
    const service = TestBed.inject(TaskService);

    clickButton(details, 'Удалить');
    await harness.fixture.whenStable();

    expect(confirmSpy).toHaveBeenCalledWith('Вы уверены, что хотите удалить эту задачу?');
    expect(service.tasks().find((item) => item.uuid === task.uuid)).toEqual(task);
    expect(details?.querySelector('h1')?.textContent).toContain('Оставить');
  });

  it('deletes the task and returns to the board after confirmation', async () => {
    const task = seedTask('Удалить меня', 'Пропаду');
    spyOn(window, 'confirm').and.returnValue(true);
    const harness = await RouterTestingHarness.create(`/tasks/${task.uuid}`);
    const service = TestBed.inject(TaskService);

    clickButton(harness.routeNativeElement, 'Удалить');
    await harness.fixture.whenStable();

    expect(service.tasks().find((item) => item.uuid === task.uuid)).toBeUndefined();
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Доска задач');
    expect(harness.routeNativeElement?.textContent).not.toContain('Удалить меня');

    await harness.navigateByUrl(`/tasks/${task.uuid}`);
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.textContent).toContain('Задача не найдена');
    expect(buttonByLabel(harness.routeNativeElement, 'Удалить')).toBeNull();
  });
});

function seedTask(title: string, description: string, status = TaskStatus.Todo) {
  const service = TestBed.inject(TaskService);
  service.addTask(title, description);
  const created = service.tasks().at(-1);

  if (!created) {
    throw new Error('Task was not created');
  }

  if (status !== TaskStatus.Todo) {
    service.updateTask(created.uuid, { status });
  }

  const task = service.tasks().find((item) => item.uuid === created.uuid);

  if (!task) {
    throw new Error('Task was not created');
  }

  return task;
}

function clickButton(root: ParentNode | null, label: string): void {
  const button = buttonByLabel(root, label);

  if (!(button instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`);
  }

  button.click();
}

function buttonByLabel(root: ParentNode | null, label: string): HTMLButtonElement | null {
  const button = [...(root?.querySelectorAll('button') ?? [])].find(
    (item) => item.textContent?.trim() === label,
  );

  return button instanceof HTMLButtonElement ? button : null;
}

function radioByValue(root: ParentNode | null, value: TaskStatus): HTMLInputElement {
  const radio = root?.querySelector(`input[type="radio"][value="${value}"]`);

  if (!(radio instanceof HTMLInputElement)) {
    throw new Error(`Radio not found: ${value}`);
  }

  return radio;
}

function setControlValue(control: Element | null, value: string): void {
  if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) {
    throw new Error('Form control not found');
  }

  control.value = value;
  control.dispatchEvent(new Event('input'));
}
