'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * State that can be controlled (`value` + `onChange`) or uncontrolled (`defaultValue`),
 * following the React convention used by native inputs.
 *
 * @internal
 */
export function useControllableState<T>({
    value,
    defaultValue,
    onChange,
}: {
    value?: T;
    defaultValue: T;
    onChange?: (value: T) => void;
}): [T, (next: T) => void] {
    const [internal, setInternal] = useState(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const setValue = useCallback(
        (next: T) => {
            if (!isControlled) setInternal(next);
            onChangeRef.current?.(next);
        },
        [isControlled],
    );

    return [current, setValue];
}
