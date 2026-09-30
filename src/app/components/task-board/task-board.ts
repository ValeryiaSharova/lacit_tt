import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, Subject } from 'rxjs';
import { TaskStatus } from '../../models/task';
import { TaskService } from '../../services/task.service';
import { TaskBoardSectionComponent } from '../task-board-section/task-board-section';
import { TaskCreateModalComponent } from '../task-create-modal/task-create-modal';

@Component({
  selector: 'app-task-board',
  imports: [TaskBoardSectionComponent, TaskCreateModalComponent],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css',
})
export class TaskBoardComponent {
  private readonly destroyRef = inject(DestroyRef);

  private readonly taskService = inject(TaskService);

  private readonly searchInput$ = new Subject<string>();

  protected readonly isCreateModalOpen = signal(false);

  protected readonly searchTerm = signal('');

  protected readonly TaskStatus = TaskStatus;

  protected readonly todoDropListId = 'task-board-todo';

  protected readonly doneDropListId = 'task-board-done';

  protected readonly filteredTasks = computed(() => {
    const query = this.searchTerm().toLowerCase();
    const tasks = this.taskService.tasks();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => task.title.toLowerCase().includes(query));
  });

  protected readonly showNoSearchResults = computed(
    () => this.searchTerm().length > 0 && this.filteredTasks().length === 0,
  );

  protected readonly todoTasks = computed(() =>
    this.filteredTasks().filter((task) => task.status === TaskStatus.Todo),
  );

  protected readonly doneTasks = computed(() =>
    this.filteredTasks().filter((task) => task.status === TaskStatus.Done),
  );

  constructor() {
    this.searchInput$
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => this.searchTerm.set(term));
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput$.next(value);
  }

  protected openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  protected closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }
}
