import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task, TaskStatus } from '../models/task';
import { TaskService } from './task.service';

describe('TaskService', () => {
  const sampleTask: Task = {
    uuid: '11111111-1111-4111-8111-111111111111',
    title: 'Задача',
    description: 'Описание',
    status: TaskStatus.Todo,
  };

  beforeEach(() => {
    localStorage.removeItem(TaskService.storageKey);

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    localStorage.removeItem(TaskService.storageKey);
  });

  function dispatchStorageEvent(init: StorageEventInit): void {
    window.dispatchEvent(new StorageEvent('storage', init));
  }

  it('updates tasks when storage emits valid JSON for the tasks key', () => {
    const service = TestBed.inject(TaskService);
    expect(service.tasks()).toEqual([]);

    const remoteTasks: Task[] = [sampleTask];

    dispatchStorageEvent({
      key: TaskService.storageKey,
      newValue: JSON.stringify(remoteTasks),
      storageArea: localStorage,
    });

    expect(service.tasks()).toEqual(remoteTasks);
    expect(localStorage.getItem(TaskService.storageKey)).toBeNull();
  });

  it('ignores storage events for other keys', () => {
    const service = TestBed.inject(TaskService);
    service.addTask('Локальная', 'Остаётся');

    const before = service.tasks();

    dispatchStorageEvent({
      key: 'other-key',
      newValue: JSON.stringify([sampleTask]),
      storageArea: localStorage,
    });

    expect(service.tasks()).toEqual(before);
  });

  it('clears tasks when storage newValue is null', () => {
    localStorage.setItem(TaskService.storageKey, JSON.stringify([sampleTask]));
    const service = TestBed.inject(TaskService);

    expect(service.tasks()).toEqual([sampleTask]);

    dispatchStorageEvent({
      key: TaskService.storageKey,
      newValue: null,
      storageArea: localStorage,
    });

    expect(service.tasks()).toEqual([]);
  });

  it('keeps current tasks when storage payload JSON is invalid', () => {
    localStorage.setItem(TaskService.storageKey, JSON.stringify([sampleTask]));
    const service = TestBed.inject(TaskService);

    expect(service.tasks()).toEqual([sampleTask]);

    dispatchStorageEvent({
      key: TaskService.storageKey,
      newValue: '{not-json',
      storageArea: localStorage,
    });

    expect(service.tasks()).toEqual([sampleTask]);
  });
});
