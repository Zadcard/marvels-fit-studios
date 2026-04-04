"use client";

import { useDeferredValue, useState } from "react";

import type { WorkspaceDefinition } from "@/lib/dashboard/workspace-definition";

type UseManagedRecordsOptions<
  TRecord extends { id: string },
  TFilters extends Record<string, string>,
  TForm extends Record<string, string>
> = {
  records: readonly TRecord[];
  definition: WorkspaceDefinition<TRecord, TFilters, TForm>;
  initialFilters: TFilters;
  initialSelectedRecordId?: string;
};

export function useManagedRecords<
  TRecord extends { id: string },
  TFilters extends Record<string, string>,
  TForm extends Record<string, string>
>({
  records,
  definition,
  initialFilters,
  initialSelectedRecordId,
}: UseManagedRecordsOptions<TRecord, TFilters, TForm>) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedRecordId, setSelectedRecordId] = useState(
    initialSelectedRecordId ?? records[0]?.id ?? ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TForm>(definition.createEmptyForm());

  const filteredRecords = records.filter((record) => {
    const query = deferredSearchTerm.trim().toLowerCase();
    const matchesSearch =
      query.length === 0 ||
      definition.getSearchValue(record).toLowerCase().includes(query);

    return matchesSearch && definition.matchesFilters(record, filters);
  });

  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedRecordId) ??
    filteredRecords[0] ??
    null;

  const setFilterValue = (
    key: Extract<keyof TFilters, string>,
    value: string
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value as TFilters[typeof key],
    }));
  };

  const updateFormField = (
    key: Extract<keyof TForm, string>,
    value: string
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value as TForm[typeof key],
    }));
  };

  const openCreateModal = () => {
    setEditingRecordId(null);
    setFormState(definition.createEmptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (record: TRecord) => {
    setEditingRecordId(record.id);
    setFormState(definition.toFormState(record));
    setIsModalOpen(true);
  };

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilterValue,
    filteredRecords,
    selectedRecord,
    selectedRecordId,
    setSelectedRecordId,
    isModalOpen,
    setIsModalOpen,
    editingRecordId,
    formState,
    updateFormField,
    openCreateModal,
    openEditModal,
  };
}
