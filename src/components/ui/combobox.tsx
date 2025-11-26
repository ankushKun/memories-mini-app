"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  hideChevron?: boolean
  onSearchChange?: (search: string) => void
  isLoading?: boolean
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  hideChevron = false,
  onSearchChange,
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          type="button"
          className={cn(
            "flex items-center justify-between w-full text-left font-normal bg-white border border-gray-300 rounded-lg",
            "hover:bg-white focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            value ? "text-black" : "text-gray-400",
            className
          )}
        >
          <span className="truncate">
            {value
              ? options.find((option) => option.value === value)?.label || value
              : placeholder}
          </span>
          {!hideChevron && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-gray-400" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white border-gray-300" align="start">
        <Command className="bg-white" shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="bg-white text-black"
            onValueChange={onSearchChange}
          />
          <CommandList className="bg-white">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
            ) : options.length === 0 ? (
              <CommandEmpty className="text-gray-500">{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup className="bg-white">
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                    className="cursor-pointer hover:bg-gray-100 text-black"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
