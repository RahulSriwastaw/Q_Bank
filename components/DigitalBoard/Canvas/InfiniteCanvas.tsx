
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text, Group, Transformer, RegularPolygon, Arrow, Star, Image as KonvaImage, Path } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../store/canvasStore';
import { Grid } from './Grid';
import { useDrawing } from '../hooks/useDrawing';
import { CanvasObject } from '../types/canvas.types';
import { getSvgPathFromStroke, getStrokePoints } from '../utils/strokeUtils';

const URLImage = ({ src, ...props }: any) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    useEffect(() => {
        const img = new window.Image();
        img.src = src;
        img.onload = () => {
            setImage(img);
        };
    }, [src]);
    return <KonvaImage image={image || undefined} {...props} />;
};

const CanvasObjectRenderer = ({
    object,
    onSelect,
    onDragEnd,
    onTransformEnd,
    onUpdate
}: {
    object: CanvasObject;
    onSelect: () => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
    onUpdate: (id: string, updates: Partial<CanvasObject>) => void;
}) => {
    const commonProps = {
        id: object.id,
        onClick: onSelect,
        onTap: onSelect,
        onDragEnd: onDragEnd,
        onTransformEnd: onTransformEnd,
        draggable: !object.locked,
    };

    const handleDblClick = () => {
        if (object.type === 'text' || object.type === 'sticky') {
            const newText = prompt('Edit text:', object.content);
            if (newText !== null) {
                onUpdate(object.id, { content: newText });
            }
        }
    };

    switch (object.type) {
        case 'pen':
            const strokePoints = getStrokePoints(object.points, { size: object.thickness });
            const pathData = getSvgPathFromStroke(strokePoints);
            return (
                <Path
                    {...commonProps}
                    key={object.id}
                    data={pathData}
                    fill={object.color}
                    opacity={object.opacity}
                    hitStrokeWidth={20}
                />
            );
        case 'shape':
            if (object.shapeType === 'rectangle') {
                return (
                    <Rect
                        {...commonProps}
                        key={object.id}
                        x={object.position.x}
                        y={object.position.y}
                        width={object.width}
                        height={object.height}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.fillColor}
                        opacity={object.opacity}
                    />
                );
            } else if (object.shapeType === 'circle') {
                return (
                    <Circle
                        {...commonProps}
                        key={object.id}
                        x={object.position.x + object.width / 2}
                        y={object.position.y + object.height / 2}
                        width={object.width}
                        height={object.height}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.fillColor}
                        opacity={object.opacity}
                    />
                );
            } else if (object.shapeType === 'triangle') {
                return (
                    <RegularPolygon
                        {...commonProps}
                        key={object.id}
                        x={object.position.x + object.width / 2}
                        y={object.position.y + object.height / 2}
                        sides={3}
                        radius={object.width / 2}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.fillColor}
                        opacity={object.opacity}
                    />
                );
            } else if (object.shapeType === 'line') {
                return (
                    <Line
                        {...commonProps}
                        key={object.id}
                        points={object.points || [0, 0, object.width, object.height]}
                        x={object.position.x}
                        y={object.position.y}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        opacity={object.opacity}
                    />
                );
            } else if (object.shapeType === 'arrow') {
                return (
                    <Arrow
                        {...commonProps}
                        key={object.id}
                        points={object.points || [0, 0, object.width, object.height]}
                        x={object.position.x}
                        y={object.position.y}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.borderColor}
                        opacity={object.opacity}
                        pointerLength={10}
                        pointerWidth={10}
                    />
                );
            } else if (object.shapeType === 'polygon') {
                return (
                    <RegularPolygon
                        {...commonProps}
                        key={object.id}
                        x={object.position.x + object.width / 2}
                        y={object.position.y + object.height / 2}
                        sides={6}
                        radius={object.width / 2}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.fillColor}
                        opacity={object.opacity}
                    />
                );
            } else if (object.shapeType === 'star') {
                return (
                    <Star
                        {...commonProps}
                        key={object.id}
                        x={object.position.x + object.width / 2}
                        y={object.position.y + object.height / 2}
                        numPoints={5}
                        innerRadius={object.width / 4}
                        outerRadius={object.width / 2}
                        stroke={object.borderColor}
                        strokeWidth={object.borderWidth}
                        fill={object.fillColor}
                        opacity={object.opacity}
                    />
                );
            }
            return null;
        case 'text':
            return (
                <Text
                    {...commonProps}
                    key={object.id}
                    x={object.position.x}
                    y={object.position.y}
                    text={object.content}
                    fontSize={object.fontSize}
                    fontFamily={object.fontFamily}
                    fill={object.color}
                    onDblClick={handleDblClick}
                    onDblTap={handleDblClick}
                />
            );
        case 'sticky':
            return (
                <Group
                    {...commonProps}
                    key={object.id}
                    x={object.position.x}
                    y={object.position.y}
                    onDblClick={handleDblClick}
                    onDblTap={handleDblClick}
                >
                    <Rect
                        width={object.width}
                        height={object.height}
                        fill={object.color}
                        shadowBlur={5}
                    />
                    <Text
                        text={object.content}
                        padding={10}
                        width={object.width}
                    />
                </Group>
            );
        case 'image':
            return (
                <URLImage
                    {...commonProps}
                    key={object.id}
                    src={object.src}
                    x={object.position.x}
                    y={object.position.y}
                    width={object.width}
                    height={object.height}
                    opacity={1}
                />
            );
        default:
            return null;
    }
};

export const InfiniteCanvas: React.FC = () => {
    const {
        objects,
        viewport,
        updateViewport,
        tool,
        gridEnabled,
        currentColor,
        currentThickness,
        currentShapeType,
        selectedIds,
        selectObjects,
        updateObject,
        deleteObject
    } = useCanvasStore();

    const stageRef = useRef<Konva.Stage>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const { isDrawing, isDrawingRef, currentPointsRef, startDrawing, draw, endDrawing } = useDrawing();

    // Preview refs
    const previewPathRef = useRef<Konva.Path>(null);
    const previewLineRef = useRef<Konva.Line>(null);
    const previewRectRef = useRef<Konva.Rect>(null);
    const previewCircleRef = useRef<Konva.Circle>(null);
    const previewRegularPolygonRef = useRef<Konva.RegularPolygon>(null);
    const previewStarRef = useRef<Konva.Star>(null);
    const previewArrowRef = useRef<Konva.Arrow>(null);
    const previewLineShapeRef = useRef<Konva.Line>(null);

    useEffect(() => {
        if (trRef.current && stageRef.current) {
            const nodes = selectedIds.map(id => stageRef.current?.findOne('#' + id)).filter(Boolean);
            trRef.current.nodes(nodes as Konva.Node[]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, objects]);

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        draw(e);

        if (!isDrawingRef.current) return;

        const points = currentPointsRef.current;
        if (points.length === 0) return;

        if (tool === 'pen' && previewLineRef.current) {
            const flatPoints = points.flatMap(p => [p.x, p.y]);
            previewLineRef.current.points(flatPoints);
            previewLineRef.current.visible(true);
            previewLineRef.current.getLayer()?.batchDraw();
        } else if (tool === 'shape' && points.length >= 2) {
            const start = points[0];
            const end = points[1];

            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x);
            const height = Math.abs(end.y - start.y);

            if (currentShapeType === 'rectangle' && previewRectRef.current) {
                previewRectRef.current.setAttrs({ x, y, width, height });
                previewRectRef.current.visible(true);
                previewRectRef.current.getLayer()?.batchDraw();
            } else if (currentShapeType === 'circle' && previewCircleRef.current) {
                previewCircleRef.current.setAttrs({
                    x: x + width / 2,
                    y: y + height / 2,
                    width,
                    height
                });
                previewCircleRef.current.visible(true);
                previewCircleRef.current.getLayer()?.batchDraw();
            } else if (['triangle', 'polygon'].includes(currentShapeType) && previewRegularPolygonRef.current) {
                previewRegularPolygonRef.current.setAttrs({
                    x: x + width / 2,
                    y: y + height / 2,
                    radius: width / 2,
                    sides: currentShapeType === 'triangle' ? 3 : 6
                });
                previewRegularPolygonRef.current.visible(true);
                previewRegularPolygonRef.current.getLayer()?.batchDraw();
            } else if (currentShapeType === 'star' && previewStarRef.current) {
                previewStarRef.current.setAttrs({
                    x: x + width / 2,
                    y: y + height / 2,
                    innerRadius: width / 4,
                    outerRadius: width / 2,
                    numPoints: 5
                });
                previewStarRef.current.visible(true);
                previewStarRef.current.getLayer()?.batchDraw();
            } else if (currentShapeType === 'line' && previewLineShapeRef.current) {
                previewLineShapeRef.current.points([0, 0, end.x - start.x, end.y - start.y]);
                previewLineShapeRef.current.position({ x: start.x, y: start.y });
                previewLineShapeRef.current.visible(true);
                previewLineShapeRef.current.getLayer()?.batchDraw();
            } else if (currentShapeType === 'arrow' && previewArrowRef.current) {
                previewArrowRef.current.points([0, 0, end.x - start.x, end.y - start.y]);
                previewArrowRef.current.position({ x: start.x, y: start.y });
                previewArrowRef.current.visible(true);
                previewArrowRef.current.getLayer()?.batchDraw();
            }
        }
    };


    // Zoom handler
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // Limit zoom
        if (newScale < 0.1 || newScale > 10) return;

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        updateViewport({ x: newPos.x, y: newPos.y, zoom: newScale });
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (tool === 'pan') {
            updateViewport({
                x: e.target.x(),
                y: e.target.y(),
            });
        }
    };

    const handleObjectDragEnd = (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
        const node = e.target;
        updateObject(id, {
            position: { x: node.x(), y: node.y() }
        });
    };

    const handleObjectTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        const id = node.id();
        const object = objects.find(o => o.id === id);
        if (!object) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale on node to avoid double scaling when re-rendering
        node.scaleX(1);
        node.scaleY(1);

        const updates: any = {
            position: { x: node.x(), y: node.y() },
            rotation: node.rotation(),
        };

        if (object.type === 'shape') {
            if (object.shapeType === 'rectangle') {
                updates.width = Math.max(5, (object.width || 0) * scaleX);
                updates.height = Math.max(5, (object.height || 0) * scaleY);
            } else if (object.shapeType === 'circle') {
                updates.width = Math.max(5, (object.width || 0) * scaleX);
                updates.height = Math.max(5, (object.height || 0) * scaleY);
            } else if (['triangle', 'polygon', 'star'].includes(object.shapeType)) {
                updates.width = Math.max(5, (object.width || 0) * scaleX);
            }
        } else if (object.type === 'text') {
            updates.fontSize = Math.round((object.fontSize || 16) * scaleY);
        } else if (object.type === 'image') {
            updates.width = Math.max(5, (object.width || 0) * scaleX);
            updates.height = Math.max(5, (object.height || 0) * scaleY);
        } else if (object.type === 'sticky') {
            updates.width = Math.max(50, (object.width || 0) * scaleX);
            updates.height = Math.max(50, (object.height || 0) * scaleY);
        }

        updateObject(id, updates);
    };

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        // clicked on stage - clear selection
        if (e.target === e.target.getStage()) {
            selectObjects([]);
            if (tool !== 'select' && tool !== 'pan') {
                startDrawing(e);
            }
            return;
        }

        // clicked on transformer - do nothing
        if (e.target.getParent()?.className === 'Transformer') {
            return;
        }

        // if using tools other than select/pan, start drawing
        if (tool !== 'select' && tool !== 'pan') {
            startDrawing(e);
        }
    };

    const handleMouseUp = () => {
        endDrawing();

        // Hide all preview elements after drawing ends
        if (previewLineRef.current) {
            previewLineRef.current.visible(false);
            previewLineRef.current.points([]);
            previewLineRef.current.getLayer()?.batchDraw();
        }
        if (previewRectRef.current) {
            previewRectRef.current.visible(false);
            previewRectRef.current.getLayer()?.batchDraw();
        }
        if (previewCircleRef.current) {
            previewCircleRef.current.visible(false);
            previewCircleRef.current.getLayer()?.batchDraw();
        }
        if (previewRegularPolygonRef.current) {
            previewRegularPolygonRef.current.visible(false);
            previewRegularPolygonRef.current.getLayer()?.batchDraw();
        }
        if (previewStarRef.current) {
            previewStarRef.current.visible(false);
            previewStarRef.current.getLayer()?.batchDraw();
        }
        if (previewLineShapeRef.current) {
            previewLineShapeRef.current.visible(false);
            previewLineShapeRef.current.getLayer()?.batchDraw();
        }
        if (previewArrowRef.current) {
            previewArrowRef.current.visible(false);
            previewArrowRef.current.getLayer()?.batchDraw();
        }
    };

    return (
        <div className="w-full h-full bg-gray-100 overflow-hidden">
            <Stage
                id="main-canvas"
                ref={stageRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={handleWheel}
                draggable={tool === 'pan'}
                onDragEnd={handleDragEnd}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleStageMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                style={{ cursor: tool === 'pan' ? 'grab' : (tool === 'pen' || tool === 'shape') ? 'crosshair' : 'default' }}
            >
                <Layer>
                    {gridEnabled && (
                        <Grid
                            viewport={viewport}
                            width={window.innerWidth}
                            height={window.innerHeight}
                        />
                    )}

                    {objects.map((obj) => (
                        <CanvasObjectRenderer
                            key={obj.id}
                            object={obj}
                            onSelect={() => {
                                if (tool === 'select') {
                                    selectObjects([obj.id]);
                                } else if (tool === 'eraser') {
                                    deleteObject(obj.id);
                                }
                            }}
                            onDragEnd={(e) => handleObjectDragEnd(e, obj.id)}
                            onTransformEnd={handleObjectTransformEnd}
                            onUpdate={updateObject}
                        />
                    ))}

                    <Transformer ref={trRef} />
                </Layer>

                <Layer listening={false}>
                    {/* Current drawing preview */}
                    {tool === 'pen' && (
                        <Line
                            ref={previewLineRef}
                            points={[]}
                            stroke={currentColor}
                            strokeWidth={currentThickness}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            visible={false}
                        />
                    )}

                    {tool === 'shape' && (
                        <>
                            {currentShapeType === 'rectangle' && (
                                <Rect
                                    ref={previewRectRef}
                                    x={0} y={0} width={0} height={0}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    visible={false}
                                />
                            )}
                            {currentShapeType === 'circle' && (
                                <Circle
                                    ref={previewCircleRef}
                                    x={0} y={0} width={0} height={0}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    visible={false}
                                />
                            )}
                            {['triangle', 'polygon'].includes(currentShapeType) && (
                                <RegularPolygon
                                    ref={previewRegularPolygonRef}
                                    x={0} y={0} radius={0} sides={currentShapeType === 'triangle' ? 3 : 6}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    visible={false}
                                />
                            )}
                            {currentShapeType === 'star' && (
                                <Star
                                    ref={previewStarRef}
                                    x={0} y={0} innerRadius={0} outerRadius={0} numPoints={5}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    visible={false}
                                />
                            )}
                            {currentShapeType === 'line' && (
                                <Line
                                    ref={previewLineShapeRef}
                                    points={[]}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    visible={false}
                                />
                            )}
                            {currentShapeType === 'arrow' && (
                                <Arrow
                                    ref={previewArrowRef}
                                    points={[]}
                                    stroke={currentColor}
                                    strokeWidth={currentThickness}
                                    fill={currentColor}
                                    pointerLength={10}
                                    pointerWidth={10}
                                    visible={false}
                                />
                            )}
                        </>
                    )}
                </Layer>
            </Stage>
        </div>
    );
};
