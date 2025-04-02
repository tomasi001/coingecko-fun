import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge className strings correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
  });

  it("should properly merge Tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle arrays of classes", () => {
    expect(cn("class1", ["class2", "class3"])).toBe("class1 class2 class3");
  });

  it("should handle empty or falsy values", () => {
    expect(cn("class1", null, undefined, false, "")).toBe("class1");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base-class",
      {
        "conditional-true": true,
        "conditional-false": false,
      },
      ["array-class-1", "array-class-2"],
      undefined,
      "direct-class"
    );
    expect(result).toBe(
      "base-class conditional-true array-class-1 array-class-2 direct-class"
    );
  });
});
