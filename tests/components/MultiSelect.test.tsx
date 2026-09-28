// tests/components/MultiSelect.test.tsx
// Behaviour of the shared MultiSelect: collapsed label states (placeholder /
// single label / "N selected"), per-option and select-all toggling, group
// headers, disabling when empty, and closing on outside click.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultiSelect } from "@/components/shared/customer_ui/MultiSelect/MultiSelect";

const OPTIONS = [
  { value: "a", label: "Alpha", group: "G1" },
  { value: "b", label: "Beta", group: "G1" },
  { value: "c", label: "Gamma", group: "G2" },
];

function setup(values: string[] = [], onChange = vi.fn()) {
  render(
    <MultiSelect
      options={OPTIONS}
      values={values}
      onChange={onChange}
      placeholder="Pick some"
      selectAllLabel="Select all"
      renderCount={(n) => `${n} selected`}
    />
  );
  return { onChange };
}

describe("MultiSelect", () => {
  it("shows the placeholder when nothing is selected", () => {
    setup([]);
    expect(screen.getByText("Pick some")).toBeInTheDocument();
  });

  it("shows the single option label when one is selected", () => {
    setup(["b"]);
    // "Beta" also exists as a (CSS-hidden) panel option, so scope to the toggle.
    expect(screen.getByRole("button")).toHaveTextContent("Beta");
  });

  it("shows the count label when several are selected", () => {
    setup(["a", "c"]);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("renders group headers once per group", () => {
    setup([]);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("G1")).toBeInTheDocument();
    expect(screen.getByText("G2")).toBeInTheDocument();
  });

  it("emits the toggled value in option order", () => {
    const { onChange } = setup(["c"]);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByLabelText("Alpha", { selector: "input" }));
    expect(onChange).toHaveBeenCalledWith(["a", "c"]);
  });

  it("select-all emits every value; unchecking it clears them", () => {
    const onChange = vi.fn();
    const { rerender } = renderMultiSelect([], onChange);
    fireEvent.click(screen.getByRole("button"));
    const selectAll = screen.getByLabelText("Select all", { selector: "input" });
    fireEvent.click(selectAll);
    expect(onChange).toHaveBeenCalledWith(["a", "b", "c"]);

    rerender(
      <MultiSelect
        options={OPTIONS}
        values={["a", "b", "c"]}
        onChange={onChange}
        placeholder="Pick some"
        selectAllLabel="Select all"
        renderCount={(n) => `${n} selected`}
      />
    );
    fireEvent.click(screen.getByLabelText("Select all", { selector: "input" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("disables the toggle when there are no options", () => {
    render(
      <MultiSelect
        options={[]}
        values={[]}
        onChange={vi.fn()}
        placeholder="Pick some"
        selectAllLabel="Select all"
        renderCount={(n) => `${n} selected`}
      />
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("closes the panel on an outside click", () => {
    setup([]);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(screen.getByText("Alpha")).toBeVisible();
    fireEvent.click(document.body);
    // Panel is hidden via the .open class being removed; the option is no
    // longer inside an open dropdown.
    const dropdown = toggle.closest(".ms-dropdown");
    expect(dropdown?.classList.contains("open")).toBe(false);
  });
});

function renderMultiSelect(values: string[], onChange: () => void) {
  return render(
    <MultiSelect
      options={OPTIONS}
      values={values}
      onChange={onChange}
      placeholder="Pick some"
      selectAllLabel="Select all"
      renderCount={(n) => `${n} selected`}
    />
  );
}
